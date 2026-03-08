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
    private readonly AUTO_DELAY = 2000; // 自动播放等待时间
    private readonly FAST_INTERVAL = 250; // 快进检测频率

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

    /**
     * 自动/快进的主循环
     */
    private _updateLoop() {
        const dialogue = this.host.dialogue;
        const status = canoeMachine.getStatus();

        // 快进逻辑：优先级最高
        if (this.isFast) {
            if (dialogue?.isTyping) dialogue.finish();
            const tl = TimelineBuilder.active;
            if (tl && !tl.completed) TimelineBuilder.skip();

            if (status === 'waiting' || status === 'idle') {
                canoeMachine.next();
            }
            return;
        }

        // 自动播放逻辑
        if (this.isAuto) {
            // 如果还在打字或播动画，等待
            if (dialogue?.isTyping) return;
            const tl = TimelineBuilder.active;
            if (tl && !tl.completed) return;

            // 如果机器处于等待输入状态，经过延迟后推进
            if (status === 'waiting' || status === 'idle') {
                this._stopLoop(); // 暂时停止循环，防止重复触发
                setTimeout(() => {
                    if (this.isAuto) {
                        canoeMachine.next();
                        this._startLoop(); // 继续循环
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
        // 使用退格键(Backspace)作为快速回溯的测试快捷键
        if (e.key === 'Backspace' && !this.uiHidden) {
            this.stopAuto();
            const success = await HistoryManager.back();
            if (success) {
                this.host.dialogue?.finish();
            }
        }

        // Ctrl 键快进 (按住)
        if (e.key === 'Control') {
            if (!this.isFast) this.toggleFast();
        }
    };

    private handleKeyUp = (e: KeyboardEvent) => {
        // 松开 Ctrl 停止快进
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

    /**
     * 处理用户点击（推进游戏或跳过演出）
     */
    public handleUserClick = () => {
        if (this.uiHidden) {
            this.uiHidden = false;
            this.host.requestUpdate();
            return;
        }

        // 关键：用户手动点击，立即停止自动播放和快进
        const wasActive = this.isAuto || this.isFast;
        this.stopAuto();

        // 如果之前是自动/快进状态，点击的第一下仅视为“停止”，不触发后续逻辑
        if (wasActive) return;

        const dialogue = this.host.dialogue;

        // 1. 优先级最高：如果文本正在播放，立刻结束文本展示
        if (dialogue && dialogue.isTyping) {
            dialogue.finish();
            return;
        }

        // 2. 优先级中等：如果演出动画正在播放且未完成，立刻跳过所有演出动画
        const tl = TimelineBuilder.active;
        if (tl && !tl.completed) {
            logger.debug('[GameView] Skipping animations via TimelineBuilder.skip()');
            TimelineBuilder.skip();
            return;
        }

        // 3. 优先级最低：一切就绪，推进到下一条指令
        const status = canoeMachine.getStatus();
        if (status === 'waiting' || status === 'idle') {
            canoeMachine.next();
        }
    };

    // --- Toolbar actions ---

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
     * 通用的保存方法，供 UI 层调用
     */
    public async performSave(slotId: string) {
        try {
            const snapshot = await GameSession.capture();
            await GameStorage.save(slotId, snapshot);
            logger.info(`[GameView] Saved to slot: ${slotId}`);
        } catch (error) {
            logger.error(`[GameView] Failed to save to slot ${slotId}:`, error);
        }
    }

    public onReplay = (e: Event) => {
        this.stopProp(e);
        console.log('TODO: Replay Voice');
    };

    public onQSave = async (e: Event) => {
        this.stopProp(e);
        try {
            const snapshot = await GameSession.capture();
            await GameStorage.save('qsave', snapshot);
            await GameStorage.save('latest', snapshot);
            logger.info('[GameView] Quick Save successful');
        } catch (error) {
            logger.error('[GameView] Quick Save failed:', error);
        }
    };
}
