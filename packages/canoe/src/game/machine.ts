import { StoryIR, BranchIR } from '@shxnovel/schema';
import { GameSession } from './session';
import { StoryManager, FlagManager, InGameData, GlobalData } from '../resource';
import { AnimateExecutor } from './runtime/animate-executor';
import { TimelineBuilder } from '../core/timeline-builder';
import { eventController } from '../core/MListener';
import { logger } from '../logger';
import { Pipeline } from '../object';
import { HistoryManager } from './history-manager';

export type MachineStatus = 'idle' | 'running' | 'waiting' | 'error';

export class CanoeMachine {
    private instructions: StoryIR[] = [];
    private status: MachineStatus = 'idle';

    /**
     * 启动自动机
     * 会根据 GameSession 当前的 chapter 加载 IR 并开始执行
     */
    async start() {
        if (!GameSession.chapter) {
            logger.error('[Machine] Cannot start: No chapter specified in Session');
            return;
        }

        // 初始化 Session 监听器
        GameSession.init();

        logger.info(`[Machine] Starting at ${GameSession.chapter}:${GameSession.index}`);
        this.instructions = await StoryManager.get(GameSession.chapter);

        // 关键修复：确保渲染管线已构建
        if (Pipeline.steps.length === 0) {
            logger.debug('[Machine] Initializing default pipeline');
            await Pipeline.build();
        }

        await this.runLoop();
    }

    /**
     * 核心执行循环
     * 顺序运行直到遇到阻塞指令或章节结束
     */
    private async runLoop() {
        this.status = 'running';

        while (this.status === 'running') {
            const ir = this.instructions[GameSession.index];
            
            if (!ir) {
                logger.info('[Machine] End of chapter reached');
                this.status = 'idle';
                break;
            }

            // 执行指令并获取是否阻塞
            const isBlocking = await this.execute(ir);

            if (isBlocking) {
                this.status = 'waiting';
                logger.debug(`[Machine] Paused at ${GameSession.chapter}:${GameSession.index} (Waiting for next)`);
                break;
            }

            // 非阻塞指令，继续下一条
            GameSession.index++;
        }
    }

    /**
     * 具体的指令分发逻辑
     */
    private async execute(ir: StoryIR): Promise<boolean> {
        logger.debug(`[Machine] Executing ${ir.type} @ ${GameSession.index}`);

        switch (ir.type) {
            case 'tick':
                // 关键修复：在记录历史前，手动同步当前文本到 Session
                // 这样 capture() 出来的快照就包含了这一条台词
                GameSession.lastText = ir.text;
                await HistoryManager.push();

                // 1. 自动机遇到新 Tick，默认清理/跳过上一个 Tick 的未完成动画
                TimelineBuilder.skip();

                // 2. 同时分发系统指令和动画指令
                await AnimateExecutor.executeSystem(ir.system);
                const res = await AnimateExecutor.executeAnimate(ir.animate);
                
                if (res?.tl) {
                    res.tl.play();
                }

                // 3. 抛出文本事件
                eventController.emit('tick', ir.text);

                return true; 

            case 'jump':
                await this.performJump(ir.target);
                return false;

            case 'branch':
                await this.handleBranch(ir);
                return false;

            case 'flag':
                return false;

            default:
                return false;
        }
    }

    /**
     * 执行跳转逻辑
     */
    private async performJump(target: string) {
        try {
            const dest = await FlagManager.getFlag(target);
            if (!dest) {
                throw new Error(`Flag '${target}' not found`);
            }

            if (GameSession.chapter !== dest.name) {
                logger.debug(`[Machine] Jumping chapter: ${GameSession.chapter} -> ${dest.name}`);
                GameSession.chapter = dest.name;
                this.instructions = await StoryManager.get(GameSession.chapter);
            }

            GameSession.index = dest.pc - 1;
            logger.info(`[Machine] Jumped to ${target} @ ${dest.name}:${dest.pc}`);
        } catch (err) {
            logger.error(`[Machine] Failed to jump to ${target}:`, err);
            this.status = 'error';
        }
    }

    /**
     * 处理条件分支
     */
    private async handleBranch(ir: BranchIR) {
        const { cond, targets, ENDFLAG } = ir;

        const ctx = {
            inGame: InGameData.visit(),
            global: GlobalData.visit(),
        };

        try {
            const evalFunc = new Function(
                'ctx',
                `const { inGame, global } = ctx; const obj = { ${cond} }; return obj.Condition.call({ inGame, global });`
            );

            const result = String(evalFunc(ctx));
            const targetFlag = targets[result] || ENDFLAG;

            logger.debug(`[Machine] Branch evaluated: "${result}" -> jumping to flag: ${targetFlag}`);
            
            await this.performJump(targetFlag);
        } catch (err) {
            logger.error(`[Machine] Failed to evaluate branch:`, err);
            this.status = 'error';
        }
    }

    /**
     * 外部调用：推进到下一条指令
     */
    async next() {
        if (this.status !== 'waiting') {
            logger.warn(`[Machine] Cannot call next() in status: ${this.status}`);
            return;
        }

        GameSession.index++;
        await this.runLoop();
    }

    /**
     * 强制跳转并重新执行指定位置的指令
     * 主要用于回溯（Rollback）后恢复现场并重新播放动画
     */
    async goto(chapter: string, index: number) {
        logger.info(`[Machine] Forced jump to ${chapter}:${index}`);
        this.status = 'idle'; // 打断当前的 waiting 状态
        
        GameSession.chapter = chapter;
        GameSession.index = index;
        
        // 确保指令加载
        if (!this.instructions.length || this.instructions !== await StoryManager.get(chapter)) {
            this.instructions = await StoryManager.get(chapter);
        }

        // 重新进入执行循环
        await this.runLoop();
    }

    getStatus() {
        return this.status;
    }
}

export const canoeMachine = new CanoeMachine();
