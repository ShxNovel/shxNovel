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
    runtime,
    RuntimeEventListener,
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

    private _unsubscribe: () => void = () => { };
    private _rafId: number = 0;

    // Runtime Event Listener
    private _runtimeListener: RuntimeEventListener = {
        onText: (data) => {
            this._handleTick(data);
            console.log('Text update:', data);
        },
        onAnimate: (data) => {
            console.log('Animate update:', data);
        },
        onSystem(data) {
            console.log('System update:', data);
        },
        onStateChange: (state) => {
            console.log('Runtime State:', state);
        },
    };

    async connectedCallback(): Promise<void> {
        super.connectedCallback();

        // 1. Subscribe to Runtime events
        this._unsubscribe = runtime.subscribe(this._runtimeListener);

        engine.useDefaultMainLoop = false;

        try {
            const intent = GameLauncher.consume();
            const context = await BootResolver.resolve(intent);

            // Initialize final pass (requires RTManager which is ready after resolver)
            await finalPass.init();

            await runtime.boot(context);

            // Auto-start the script
            logger.info('Auto-starting script');
            await runtime.resume();
        } catch (e) {
            console.error(e);
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
        this._unsubscribe();
        cancelAnimationFrame(this._rafId);
        runtime.reset(true);

        engine.useDefaultMainLoop = true;
    }

    private _handleTick(data: SceneBlock['text']) {
        const ShouldQuote = data[0].quote;
        this.dialogue.useQuote = ShouldQuote;
        this.dialogue.init();

        const solveText = (c: UnpackArray<TextUnit['content']>) => {
            if (typeof c === 'string') {
                this.dialogue.addText(c);
            } else {
                // Handle other text commands
                switch (c.kind) {
                    case 'pause':
                        this.dialogue.addPause(c.args?.ms || 500);
                        break;

                    case 'fast':
                        this.dialogue.addInstantText(c.args?.str || '');
                        break;

                    default:
                        logger.error(`Unknown command: ${c.kind}`);
                        break;
                }
            }
        };

        for (const item of data) {
            if (item.type === 'text') {
                const content = item.content;

                if (Array.isArray(content)) {
                    content.forEach(solveText);
                } else if (typeof content === 'string') {
                    this.dialogue.addText(content);
                }
            }
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
