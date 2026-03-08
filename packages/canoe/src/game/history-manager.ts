import { GameSession, SessionState } from './session';
import { logger } from '../logger';
import { canoeMachine } from './machine';

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
        // 获取并恢复上一个状态，同时保留它在栈顶
        const prevState = this.stack[this.stack.length - 1];
        
        await GameSession.restore(prevState);
        // 强制自动机重新执行该句，播放演出
        await canoeMachine.goto(prevState.chapter, prevState.index);
        
        logger.info(`[History] Rolled back to ${prevState.chapter}:${prevState.index}`);
        return true;
    }

    /**
     * 跳转到历史栈中的特定状态，并清除该点之后的所有记录
     */
    static async jumpBackTo(target: SessionState) {
        // 1. 查找目标快照在栈中的索引
        // 我们通过 chapter 和 index 来定位（通常这在单次会话中是唯一的）
        const index = this.stack.findIndex(s => s.chapter === target.chapter && s.index === target.index);
        
        if (index === -1) {
            logger.error('[History] Target state not found in history stack');
            return;
        }

        logger.info(`[History] Truncating history to index ${index}`);

        // 2. 截断栈，保留目标点及之前的记录
        this.stack = this.stack.slice(0, index + 1);

        // 3. 恢复现场 (恢复到该句执行前的物理状态)
        await GameSession.restore(target);
        
        // 4. 强制自动机重新执行该句，播放演出
        await canoeMachine.goto(target.chapter, target.index);
    }

    /**
     * 获取当前完整的历史记录（返回副本）
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
