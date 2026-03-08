import { loadJson } from '../../utils/loadFile';
import { GameStorage } from '../game-storage';
import { SessionState } from '../session';
import { logger } from '../../logger';

/**
 * 启动意图定义
 */
export type BootIntent =
    | { type: 'new' }
    | { type: 'continue' }
    | { type: 'load'; saveId: string }
    | { type: 'debug'; chapterId: string; index?: number };

/**
 * 启动上下文，包含进入自动机前的所有必要信息
 */
export interface BootContext {
    mode: 'new' | 'restore';
    
    // 逻辑指针
    chapter: string;
    index: number;

    // 核心快照数据 (如果 mode 为 restore)
    snapshot?: SessionState;

    meta?: {
        saveId?: string;
        isDebug?: boolean;
    };
}

export class BootResolver {
    /**
     * 将启动意图解析为上下文
     */
    static async resolve(intent: BootIntent): Promise<BootContext> {
        logger.info(`[Boot] Resolving intent: ${intent.type}`);

        switch (intent.type) {
            case 'new':
                return await this.resolveNewGame();

            case 'continue':
                return await this.resolveFromSave('latest');

            case 'load':
                return await this.resolveFromSave(intent.saveId);

            case 'debug':
                return {
                    mode: 'new',
                    chapter: intent.chapterId,
                    index: intent.index ?? 0,
                    meta: { isDebug: true }
                };

            default:
                throw new Error(`Unknown intent type: ${(intent as any).type}`);
        }
    }

    /**
     * 解析新游戏逻辑
     * 读取 StoryIR 编译出的 config.json 获取入口章节
     */
    private static async resolveNewGame(): Promise<BootContext> {
        try {
            const config = await loadJson('/game/storyIR/config.json');
            if (!config.entry) {
                throw new Error('Entry chapter not found in story config');
            }

            return {
                mode: 'new',
                chapter: config.entry,
                index: 0
            };
        } catch (err) {
            logger.error('[Boot] Failed to resolve new game:', err);
            throw err;
        }
    }

    /**
     * 解析存档逻辑
     */
    private static async resolveFromSave(saveId: string): Promise<BootContext> {
        try {
            const snapshot = await GameStorage.load(saveId) as SessionState;
            if (!snapshot) {
                throw new Error(`Save data not found for ID: ${saveId}`);
            }

            return {
                mode: 'restore',
                chapter: snapshot.chapter,
                index: snapshot.index,
                snapshot,
                meta: {
                    saveId
                }
            };
        } catch (err) {
            logger.error(`[Boot] Failed to resolve save ${saveId}:`, err);
            throw err;
        }
    }
}
