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

    private _autoTimer: any = null;
    private readonly AUTO_DELAY = 2000; 
    private readonly FAST_INTERVAL = 250; 

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
            toggleAuto: () => this.toggleAuto(),
            toggleFast: () => this.toggleFast(),
            stopAuto: () => this.stopAuto(),
        };
    }

    // --- Core Logic ---

    public toggleAuto() {
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
        const dialogue = this.host.dialogue;
        const status = canoeMachine.getStatus();

        if (this.isFast) {
            if (dialogue?.isTyping) dialogue.finish();
            const tl = TimelineBuilder.active;
            if (tl && !tl.completed) TimelineBuilder.skip();

            if (status === 'waiting' || status === 'idle') {
                canoeMachine.next();
            }
            return;
        }

        if (this.isAuto) {
            if (dialogue?.isTyping) return;
            const tl = TimelineBuilder.active;
            if (tl && !tl.completed) return;

            if (status === 'waiting' || status === 'idle') {
                this._stopLoop(); 
                setTimeout(() => {
                    if (this.isAuto) {
                        canoeMachine.next();
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
        if (e.key === 'Control') {
            if (this.isFast) this.stopAuto();
        }
    };

    private handleWheel = (e: WheelEvent) => {
        if (e.deltaY > 0) {
            this.handleUserClick();
        } else if (e.deltaY < 0) {
            console.log('TODO: Open Backlog');
        }
    };

    private handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        if (!this.uiHidden) {
            this.uiHidden = true;
            this.host.requestUpdate();
        }
    };

    public handleUserClick = () => {
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
        console.log('TODO: Open Backlog');
    };

    public onSave = (e: Event) => {
        this.stopProp(e);
        console.log('TODO: Open Save UI');
    };

    /**
     * 判断当前是否允许存档
     */
    private canSaveNow(): boolean {
        const dialogue = this.host.dialogue;
        // 如果正在打字，不允许存档
        if (dialogue && dialogue.isTyping) return false;

        // 如果 Master Timeline 正在播放，不允许存档
        const tl = TimelineBuilder.active;
        if (tl && !tl.completed) return false;

        const status = canoeMachine.getStatus();
        // 只有在等待用户输入（此时演出已播完）或者是空闲状态时才允许存档
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
            // 额外存一份到 latest，以便主菜单“继续游戏”
            const snapshot = await GameSession.capture();
            await GameStorage.save('latest', snapshot);
            logger.info('[GameView] Quick Save successful');
        } else {
            // 如果保存被阻止（例如正在演出），发出通知
            this.host.dispatchEvent(new CustomEvent('save-blocked', { bubbles: true, composed: true }));
        }
    };
}
