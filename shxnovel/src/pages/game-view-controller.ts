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

    private _monitorTimer: any = null;
    private readonly AUTO_DELAY = 2000;
    private readonly FAST_INTERVAL = 100;
    private readonly IDLE_INTERVAL = 1000;

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

        // 启动持久化监控循环
        this._startMonitor();
    }

    hostDisconnected() {
        this.host.removeEventListener('wheel', this.handleWheel);
        this.host.removeEventListener('contextmenu', this.handleContextMenu);
        this.host.removeEventListener('click', this.handleUserClick);
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);

        this._stopMonitor();
    }

    private _startMonitor() {
        this._stopMonitor();
        const interval = (this.isFast || this.isAuto) ? this.FAST_INTERVAL : this.IDLE_INTERVAL;
        this._monitorTimer = setInterval(() => this._updateLoop(), interval);
    }

    private _stopMonitor() {
        if (this._monitorTimer) {
            clearInterval(this._monitorTimer);
            this._monitorTimer = null;
        }
    }

    /**
     * 当状态改变时，可能需要调整轮询频率
     */
    private _refreshMonitor() {
        this._startMonitor();
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
            this._refreshMonitor();
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
            this._refreshMonitor();
        }
        this.host.requestUpdate();
    }

    public stopAuto() {
        if (this.isAuto || this.isFast) {
            this.isAuto = false;
            this.isFast = false;
            logger.info('Auto/Fast Stopped');
            this._refreshMonitor();
            this.host.requestUpdate();
        }
    }

    private _updateLoop() {
        if (this.isModalOpen) return;

        const dialogue = this.host.dialogue;
        const status = canoeMachine.getStatus();
        const tl = TimelineBuilder.active;
        const isAnimating = tl && !tl.completed;

        // --- 1. BindNext Logic (优先级最高，始终运行) ---
        const currentIR = canoeMachine.getCurrentInstruction();
        if (currentIR?.meta?.bindNext) {
            // 如果满足推进条件（打字完、动画完、正在等待）
            if (!dialogue?.isTyping && !isAnimating && status === 'waiting') {
                logger.debug('[GameView] BindNext triggered auto-advance');
                canoeMachine.next();
                return; // 本轮结束
            }
        }

        // --- 2. Fast Mode Logic (追求最快速度) ---
        if (this.isFast) {
            if (dialogue?.isTyping) dialogue.finish();
            if (isAnimating) TimelineBuilder.skip();

            if (status === 'waiting' || status === 'idle') {
                canoeMachine.next();
            }
            return;
        }

        // --- 3. Auto Mode Logic (温和等待) ---
        if (this.isAuto) {
            if (dialogue?.isTyping || isAnimating) return;

            if (status === 'waiting' || status === 'idle') {
                // 暂时停止高频监控
                this._stopMonitor();

                setTimeout(() => {
                    if (this.isAuto && !this.isModalOpen) {
                        const currentTl = TimelineBuilder.active;
                        const currentlyAnimating = currentTl && !currentTl.completed;

                        if (!dialogue?.isTyping && !currentlyAnimating) {
                            canoeMachine.next();
                        }
                        this._startMonitor(); // 恢复监控
                    } else {
                        this._startMonitor(); // 即使没推进也要恢复监控
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
            this.setModalState(true);
        }
    };

    private canSaveNow(): boolean {
        const dialogue = this.host.dialogue;
        if (dialogue && dialogue.isTyping) return false;

        const tl = TimelineBuilder.active;
        if (tl && !tl.completed) return false;

        const status = canoeMachine.getStatus();
        return status === 'waiting' || status === 'idle';
    }

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
            this.host.dispatchEvent(new CustomEvent('save-blocked', { bubbles: true, composed: true }));
        }
    };
}

