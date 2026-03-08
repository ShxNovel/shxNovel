import { SnapshotManager, GameSnapshot as CoreSnapshot } from '../core/snapshot-manager';
import { StoryManager } from '../resource/story-manager';
import { logger } from '../logger';
import { eventController } from '../core/MListener';

/**
 * 完整的游戏会话状态
 * 包含底层渲染状态、逻辑进度以及当前文本快照
 */
export interface SessionState extends CoreSnapshot {
    chapter: string;
    index: number;
    /** 当前正在显示的文本快照（用于 Backlog） */
    lastText?: any;
}

export class GameSession {
    /** 逻辑进度：当前所在章节 ID */
    static chapter: string = '';
    /** 逻辑进度：当前执行到的指令索引 (PC) */
    static index: number = 0;
    /** 当前对话文本快照 */
    static lastText: any = null;

    private static _initialized = false;

    /**
     * 初始化 Session 监听器
     */
    static init() {
        if (this._initialized) return;
        // 自动缓存最新的文本指令
        eventController.on('tick', (textData) => {
            this.lastText = textData;
        });
        this._initialized = true;
    }

    /**
     * 捕获当前瞬间的完整存档数据
     */
    static async capture(): Promise<SessionState> {
        this.init();
        logger.debug(`[Session] Capturing state at ${this.chapter}:${this.index}`);
        
        const coreSnapshot = await SnapshotManager.takeSnapshot();
        
        return {
            ...coreSnapshot,
            chapter: this.chapter,
            index: this.index,
            lastText: this.lastText
        };
    }

    /**
     * 从存档数据中完整还原整个游戏现场
     */
    static async restore(state: SessionState) {
        this.init();
        logger.info(`[Session] Restoring session to ${state.chapter}:${state.index}`);
        
        this.chapter = state.chapter;
        this.index = state.index;
        this.lastText = state.lastText;

        // 1. 确保目标章节的 StoryIR 已加载
        await StoryManager.ensure(this.chapter);

        // 2. 调用 Core 层还原：Pipeline, Cameras, Visuals, InGameData
        await SnapshotManager.applySnapshot(state);
        
        // 3. 触发 UI 更新以显示恢复后的文本
        if (this.lastText) {
            eventController.emit('tick', this.lastText);
        }
        
        logger.debug(`[Session] Restore complete`);
    }

    /**
     * 重置会话状态
     */
    static reset() {
        this.chapter = '';
        this.index = 0;
        this.lastText = null;
        logger.debug(`[Session] Session reset`);
    }
}
