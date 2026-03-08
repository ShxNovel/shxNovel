import { SnapshotManager, GameSnapshot as CoreSnapshot } from '../core/snapshot-manager';
import { StoryManager } from '../resource/story-manager';
import { logger } from '../logger';

/**
 * 完整的游戏会话状态
 * 包含底层渲染状态（Pipeline, Camera, Visual, InGameData）和逻辑进度（Chapter, Index）
 */
export interface SessionState extends CoreSnapshot {
    chapter: string;
    index: number;
}

export class GameSession {
    /** 逻辑进度：当前所在章节 ID */
    static chapter: string = '';
    /** 逻辑进度：当前执行到的指令索引 (PC) */
    static index: number = 0;

    /**
     * 捕获当前瞬间的完整存档数据
     * 该操作是异步的，因为它可能需要等待某些资源状态同步
     */
    static async capture(): Promise<SessionState> {
        logger.debug(`[Session] Capturing state at ${this.chapter}:${this.index}`);
        
        const coreSnapshot = await SnapshotManager.takeSnapshot();
        
        return {
            ...coreSnapshot,
            chapter: this.chapter,
            index: this.index,
        };
    }

    /**
     * 从存档数据中完整还原整个游戏现场
     * 1. 还原逻辑进度指针
     * 2. 预加载目标章节 IR
     * 3. 调用 Core 层还原所有视觉对象、相机、管线和游戏变量
     */
    static async restore(state: SessionState) {
        logger.info(`[Session] Restoring session to ${state.chapter}:${state.index}`);
        
        // 1. 同步逻辑指针
        this.chapter = state.chapter;
        this.index = state.index;

        // 2. 确保目标章节的 StoryIR 已加载，防止自动机启动时 IR 缺失
        await StoryManager.ensure(this.chapter);

        // 3. 调用 Core 层还原：Pipeline, Cameras, Visuals, InGameData
        await SnapshotManager.applySnapshot(state);
        
        logger.debug(`[Session] Restore complete`);
    }

    /**
     * 重置会话状态
     */
    static reset() {
        this.chapter = '';
        this.index = 0;
        logger.debug(`[Session] Session reset`);
    }
}
