import type { RewriteParser } from '@shxnovel/rewrite';
import { logger } from '../logger';
import { loadJson } from '../utils/loadFile';

type CacheValueWithUndefined = ReturnType<RewriteParser['cache']['get']>;
type IRNodes = NonNullable<CacheValueWithUndefined>;

export class StoryManager {
    static pool = new Map<string, Promise<IRNodes>>();

    static base = '/game/storyIR';

    /**
     * "ensure" is an idempotent operation.
     * @example
     * this.base = '/game/storyIR';
     * this.ensure('1'); // => ensure /game/storyIR/1.ir.json
     */
    static ensure(key: string): void {
        if (this.pool.has(key)) {
            logger.debug(`Hit cache for ${key}`);
            return;
        }

        const src = `${this.base}/${key}.ir.json`;

        const loadingTask = loadJson(src).catch((err) => {
            this.pool.delete(key);

            logger.error(`Failed to load ${key}:`, err);

            throw err;
        });

        this.pool.set(key, loadingTask);

        logger.debug(`loading cache for ${key}`);
    }

    /**
     * Get IR nodes from cache
     * @param key - source file path
     * @returns Promise of IR nodes
     * @example
     * this.base = '/game/storyIR';
     * this.get('1'); // => get /game/storyIR/1.ir.json
     */
    static async get(key: string): Promise<IRNodes> {
        // defensive ensure
        this.ensure(key);

        return this.pool.get(key)!;
    }
}
