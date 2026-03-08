import { GameSession, SessionState } from './session';
import { logger } from '../logger';

/**
 * 历史记录管理器
 * 负责管理内存中的回溯栈（Backtrack Stack）
 */
export class HistoryManager {
    /** 内存中的历史快照栈 */
    private static stack: SessionState[] = [];
    
    /** 最大回溯步数 */
    static maxSteps = 50;

    /**
     * 在每个阻塞指令（如 Tick）执行前调用，记录当前状态
     */
    static async push() {
        const snapshot = await GameSession.capture();
        
        // 只有当位置发生变化时才记录，防止重复推入
        const last = this.stack[this.stack.length - 1];
        if (last && last.chapter === snapshot.chapter && last.index === snapshot.index) {
            return;
        }

        this.stack.push(snapshot);

        if (this.stack.length > this.maxSteps) {
            this.stack.shift(); 
        }
        logger.debug(`[History] Snapshot added at ${snapshot.chapter}:${snapshot.index}. Stack size: ${this.stack.length}`);
    }

    /**
     * 回溯到上一个状态
     * @returns {boolean} 是否回溯成功
     */
    static async back(): Promise<boolean> {
        if (this.stack.length < 2) {
            logger.warn('[History] No more history to go back to');
            return false;
        }

        // 弹出当前正在显示的状态
        this.stack.pop();
        // 获取上一个状态
        const prevState = this.stack[this.stack.length - 1];
        
        await GameSession.restore(prevState);
        logger.info(`[History] Rolled back to ${prevState.chapter}:${prevState.index}`);
        return true;
    }

    /**
     * 获取当前完整的历史记录（用于存档中记录回溯历史，可选）
     */
    static getStack() {
        return [...this.stack];
    }

    /**
     * 清空历史
     */
    static clear() {
        this.stack = [];
    }
}
