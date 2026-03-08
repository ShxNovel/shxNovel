import { LitElement, html, css, unsafeCSS, PropertyValues } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { Router } from '@vaadin/router';
import { classMap } from 'lit/directives/class-map.js';
import { provide } from '@lit/context';

import { GameViewController, GameViewHost } from './game-view-controller';

// @ts-ignore
import inlineStyles from './game-view.css?inline';
import '../components';
import { GameDialogue } from '../components/game/game-dialogue';
import {
    MainRenderer,
    GameLauncher,
    BootResolver,
    GameSession,
    canoeMachine,
    eventController,
    renderLoop,
    finalPass,
} from '@shxnovel/canoe';

import type { SceneBlock, TextUnit } from '@shxnovel/rewrite';
import { logger } from '@shxnovel/canoe/logger.js';
import { gameContext } from '../context/game-context';
import { engine } from 'animejs';

type UnpackArray<T> = T extends (infer U)[] ? U : T;

@customElement('game-view')
export class GameView extends LitElement implements GameViewHost {
    static styles = [
        unsafeCSS(inlineStyles),
        css`
            .ui-layer {
                transition: opacity 0.1s ease-in-out;
                opacity: 1;
                pointer-events: auto;
            }
            .ui-hidden {
                opacity: 0;
                pointer-events: none;
            }
            .CanvasBox canvas {
                display: block;
                width: 100%;
                height: 100%;
            }
        `,
    ];

    @query('.CanvasBox', true) CanvasBox!: HTMLDivElement;
    @query('game-dialogue') dialogue!: GameDialogue;

    private _controller = new GameViewController(this);

    // Provide context to children
    @provide({ context: gameContext })
    get contextValue() {
        return this._controller.gameContext;
    }

    private _rafId: number = 0;

    // 事件处理回调，使用箭头函数绑定 this
    private _handleTickEvent = (data: any) => {
        this._handleTick(data);
        console.log('[GameView] Tick Event Received:', data);
    };

    async connectedCallback(): Promise<void> {
        super.connectedCallback();

        // 1. 订阅 Canoe 全局事件总线
        eventController.on('tick', this._handleTickEvent);

        engine.useDefaultMainLoop = false;

        try {
            // 2. 获取启动意图并解析上下文
            const intent = GameLauncher.consume();
            const context = await BootResolver.resolve(intent);

            // 3. 初始化最终渲染管线
            await finalPass.init();

            // 4. 根据上下文恢复或初始化 Session
            if (context.mode === 'restore' && context.snapshot) {
                await GameSession.restore(context.snapshot);
            } else {
                GameSession.reset();
                GameSession.chapter = context.chapter;
                GameSession.index = context.index;
            }

            // 5. 启动自动机
            logger.info('[GameView] Starting CanoeMachine');
            await canoeMachine.start();
        } catch (e) {
            console.error('[GameView] Boot failed:', e);
            Router.go('/menu');
        }
    }

    protected firstUpdated(_changedProperties: PropertyValues): void {
        super.firstUpdated(_changedProperties);

        if (this.CanvasBox) {
            this.CanvasBox.appendChild(MainRenderer.domElement);
            this._startLoop();
        }
    }

    private _startLoop() {
        const tick = (t: number) => {
            renderLoop.loop(t);
            this._rafId = requestAnimationFrame(tick);
        };
        this._rafId = requestAnimationFrame(tick);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        
        // 6. 清理
        eventController.off('tick', this._handleTickEvent);
        cancelAnimationFrame(this._rafId);
        GameSession.reset();

        engine.useDefaultMainLoop = true;
    }

    private _handleTick(data: SceneBlock['text']) {
        if (!data || !this.dialogue) return;

        // 设置说话人和引号样式
        this.dialogue.useQuote = data.quote;
        this.dialogue.init();

        const solveText = (c: UnpackArray<TextUnit['content']>) => {
            if (typeof c === 'string') {
                this.dialogue.addText(c);
            } else {
                switch (c.kind) {
                    case 'wait':
                        this.dialogue.addPause(c.ms || 500);
                        break;
                    case 'fast':
                        this.dialogue.addInstantText(c.text || '');
                        break;
                    default:
                        logger.error(`Unknown text command: ${(c as any).kind}`);
                        break;
                }
            }
        };

        // 处理内容数组
        const content = data.content;
        if (Array.isArray(content)) {
            content.forEach(solveText);
        } else if (typeof content === 'string') {
            this.dialogue.addText(content);
        }

        this.dialogue.play();
    }

    render() {
        const uiClasses = {
            'ui-layer': true,
            'ui-hidden': this._controller.uiHidden,
        };

        const ctrl = this._controller;

        return html`
            <div class="body">
                <game-top-menu class=${classMap(uiClasses)} @click=${ctrl.stopProp}></game-top-menu>

                <div class="CanvasBox"></div>

                <div class="bottom ${classMap(uiClasses)}">
                    <game-dialogue></game-dialogue>
                    <game-bottom-tool
                        @click=${ctrl.stopProp}
                        @toggle=${ctrl.onToggle}
                        @backlog=${ctrl.onBacklog}
                        @save=${ctrl.onSave}
                        @auto=${ctrl.onAuto}
                        @fast=${ctrl.onFast}
                        @replay=${ctrl.onReplay}
                        @qsave=${ctrl.onQSave}
                    ></game-bottom-tool>
                </div>
            </div>
        `;
    }
}
