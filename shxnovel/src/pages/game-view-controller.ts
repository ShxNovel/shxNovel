import { ReactiveController, ReactiveControllerHost } from 'lit';
import { canoeMachine, GameSession, GameStorage, HistoryManager, TimelineBuilder } from '@shxnovel/canoe';
import { GameDialogue } from '../components/game/game-dialogue';
import { logger } from '@shxnovel/canoe/logger.js';

export interface GameViewHost extends ReactiveControllerHost, HTMLElement {
    dialogue: GameDialogue;
}

export class GameViewController implements ReactiveController {
    host: GameViewHost;

    public uiHidden = false;
    public isAuto = false;
    public isFast = false;
    public isModalOpen = false;

    private _autoTimer: any = null;
    private readonly AUTO_DELAY = 2000;
    private readonly FAST_INTERVAL = 250;

    /** 冷却状态：防止关闭模态层时的点击穿透 */
    private _isClosingCooldown = false;

    constructor(host: GameViewHost) {
        this.host = host;
        host.addController(this);
    }

    hostConnected() {
        this.host.addEventListener('wheel', this.handleWheel);
        this.host.addEventListener('contextmenu', this.handleContextMenu);
        this.host.addEventListener('click', this.handleUserClick);
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }

    hostDisconnected() {
        this.host.removeEventListener('wheel', this.handleWheel);
        this.host.removeEventListener('contextmenu', this.handleContextMenu);
        this.host.removeEventListener('click', this.handleUserClick);
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        this._stopLoop();
    }

    /**
     * 核心修复：每次调用都返回一个全新的对象引用
     */
    get gameContext() {
        return {
            isAuto: this.isAuto,
            isFast: this.isFast,
            isModalOpen: this.isModalOpen,
            toggleAuto: () => this.toggleAuto(),
            toggleFast: () => this.toggleFast(),
            stopAuto: () => this.stopAuto(),
            setModalState: (open: boolean) => this.setModalState(open),
        };
    }

    // --- Core Logic ---

    public setModalState(open: boolean) {
        if (!open && this.isModalOpen) {
            // 如果是从开启转为关闭，开启短暂的点击拦截冷却
            this._isClosingCooldown = true;
            setTimeout(() => { this._isClosingCooldown = false; }, 100);
        }

        this.isModalOpen = open;
        if (open) {
            this.stopAuto();
        }
        this.host.requestUpdate();
    }

    public toggleAuto() {
        if (this.isModalOpen) return;

        if (this.isAuto) {
            this.stopAuto();
        } else {
            this.isFast = false;
            this.isAuto = true;
            logger.info('Auto Mode: ON');
            this._startLoop();
        }
        this.host.requestUpdate();
    }

    public toggleFast() {
        if (this.isModalOpen) return;

        if (this.isFast) {
            this.stopAuto();
        } else {
            this.isAuto = false;
            this.isFast = true;
            logger.info('Fast Mode: ON');
            this._startLoop();
        }
        this.host.requestUpdate();
    }

    public stopAuto() {
        if (this.isAuto || this.isFast) {
            this.isAuto = false;
            this.isFast = false;
            this._stopLoop();
            logger.info('Auto/Fast Stopped');
            this.host.requestUpdate();
        }
    }

    private _startLoop() {
        this._stopLoop();
        this._autoTimer = setInterval(() => this._updateLoop(), this.isFast ? this.FAST_INTERVAL : 200);
    }

    private _stopLoop() {
        if (this._autoTimer) {
            clearInterval(this._autoTimer);
            this._autoTimer = null;
        }
    }

    private _updateLoop() {
        if (this.isModalOpen) {
            this.stopAuto();
            return;
        }

        const dialogue = this.host.dialogue;
        const status = canoeMachine.getStatus();
        const tl = TimelineBuilder.active;
        const isAnimating = tl && !tl.completed;

        // --- Fast Mode Logic (保持不变，追求最快速度) ---
        if (this.isFast) {
            if (dialogue?.isTyping) dialogue.finish();
            if (isAnimating) TimelineBuilder.skip();

            if (status === 'waiting' || status === 'idle') {
                canoeMachine.next();
            }
            return;
        }

        // --- Auto Mode Logic (重构：温和等待) ---
        if (this.isAuto) {
            // 1. 如果还在打字或者播动画，直接跳过本轮，不做任何操作
            if (dialogue?.isTyping || isAnimating) {
                return;
            }

            // 2. 只有在等待点击的状态下，才进行推进逻辑
            if (status === 'waiting' || status === 'idle') {
                // 停止当前的高频轮询计时器
                this._stopLoop();

                // 开启一个单次的延迟任务
                setTimeout(() => {
                    // 再次检查状态，防止在等待期间玩家关闭了 Auto 或打开了模态层
                    if (this.isAuto && !this.isModalOpen) {
                        const currentTl = TimelineBuilder.active;
                        const currentlyAnimating = currentTl && !currentTl.completed;

                        // 确保在这一秒钟的等待里，没有新的演出被触发（例如异步加载）
                        if (!dialogue?.isTyping && !currentlyAnimating) {
                            canoeMachine.next();
                        }

                        // 无论是否推进，都重新回到轮询循环
                        this._startLoop();
                    }
                }, this.AUTO_DELAY);
            }
        }
    }

    public toggleUI() {
        this.uiHidden = !this.uiHidden;
        this.host.requestUpdate();
    }

    // --- Event Handlers ---

    private handleKeyDown = async (e: KeyboardEvent) => {
        if (this.isModalOpen) return;

        if (e.key === 'Backspace' && !this.uiHidden) {
            this.stopAuto();
            const success = await HistoryManager.back();
            if (success) {
                this.host.dialogue?.finish();
            }
        }

        if (e.key === 'Control') {
            if (!this.isFast) this.toggleFast();
        }
    };

    private handleKeyUp = (e: KeyboardEvent) => {
        if (this.isModalOpen) return;

        if (e.key === 'Control') {
            if (this.isFast) this.stopAuto();
        }
    };

    private handleWheel = (e: WheelEvent) => {
        if (this.isModalOpen) return;

        if (e.deltaY > 10) {
            this.handleUserClick();
        } else if (e.deltaY < -10) {
            // 只有在允许存档（演出静止）时才允许打开 Backlog
            if (this.canSaveNow()) {
                this.host.dispatchEvent(new CustomEvent('open-backlog', { bubbles: true, composed: true }));
            }
        }
    };

    private handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        if (this.isModalOpen) return;

        if (!this.uiHidden) {
            this.uiHidden = true;
            this.host.requestUpdate();
        }
    };

    public handleUserClick = () => {
        // 如果模态层开启，或者是刚刚关闭（冷却中），则不响应点击推进
        if (this.isModalOpen || this._isClosingCooldown) return;

        if (this.uiHidden) {
            this.uiHidden = false;
            this.host.requestUpdate();
            return;
        }

        const wasActive = this.isAuto || this.isFast;
        this.stopAuto();

        if (wasActive) return;

        const dialogue = this.host.dialogue;

        if (dialogue && dialogue.isTyping) {
            dialogue.finish();
            return;
        }

        const tl = TimelineBuilder.active;
        if (tl && !tl.completed) {
            logger.debug('[GameView] Skipping animations via TimelineBuilder.skip()');
            TimelineBuilder.skip();
            return;
        }

        const status = canoeMachine.getStatus();
        if (status === 'waiting' || status === 'idle') {
            canoeMachine.next();
        }
    };

    // Toolbar actions
    public stopProp = (e: Event) => e.stopPropagation();

    public onToggle = (e: Event) => {
        this.stopProp(e);
        this.toggleUI();
    };

    public onAuto = (e: Event) => {
        this.stopProp(e);
        this.toggleAuto();
    };

    public onFast = (e: Event) => {
        this.stopProp(e);
        this.toggleFast();
    };

    public onBacklog = (e: Event) => {
        this.stopProp(e);
        if (this.canSaveNow()) {
            this.host.dispatchEvent(new CustomEvent('open-backlog', { bubbles: true, composed: true }));
        } else {
            logger.warn('[GameView] Cannot open backlog during animations');
        }
    };

    public onSave = (e: Event) => {
        this.stopProp(e);
        if (this.canSaveNow()) {
            console.log('TODO: Open Save UI');
            this.setModalState(true);
        }
    };

    /**
     * 判断当前是否允许存档
     */
    private canSaveNow(): boolean {
        const dialogue = this.host.dialogue;
        if (dialogue && dialogue.isTyping) return false;

        const tl = TimelineBuilder.active;
        if (tl && !tl.completed) return false;

        const status = canoeMachine.getStatus();
        return status === 'waiting' || status === 'idle';
    }

    /**
     * 通用的保存方法，供 UI 层调用
     */
    public async performSave(slotId: string) {
        if (!this.canSaveNow()) {
            logger.warn('[GameView] Cannot save during animations or typing');
            return false;
        }

        try {
            const snapshot = await GameSession.capture();
            await GameStorage.save(slotId, snapshot);
            logger.info(`[GameView] Saved to slot: ${slotId}`);
            return true;
        } catch (error) {
            logger.error(`[GameView] Failed to save to slot ${slotId}:`, error);
            return false;
        }
    }

    public onReplay = (e: Event) => {
        this.stopProp(e);
        console.log('TODO: Replay Voice');
    };

    public onQSave = async (e: Event) => {
        this.stopProp(e);

        const success = await this.performSave('qsave');
        if (success) {
            logger.info('[GameView] Quick Save successful');
        } else {
            // 如果保存被阻止（例如正在演出），发出通知
            this.host.dispatchEvent(new CustomEvent('save-blocked', { bubbles: true, composed: true }));
        }
    };
}

