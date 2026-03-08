import { logger } from '../logger';
import { WorldManager } from './world-manager';

export class PipelineManager {
    static pool = new Map<string, Promise<any>>();

    /**
     * Ensure a pipeline resource is loaded
     * @param key - The pipeline name in manifest
     */
    static ensure(key: string): void {
        if (this.pool.has(key)) {
            logger.debug(`Hit cache for pipeline: ${key}`);
            return;
        }

        const loadingTask = WorldManager.get(key).then(ir => {
            if (ir.kind !== 'pipeline') {
                throw new Error(`Resource ${key} is not a pipeline`);
            }
            return ir;
        }).catch((err) => {
            this.pool.delete(key);
            logger.error(`Failed to load pipeline ${key}:`, err);
            throw err;
        });

        this.pool.set(key, loadingTask);
        logger.debug(`Loading cache for pipeline: ${key}`);
    }

    /**
     * Get a pipeline IR
     * @param key - The pipeline name in manifest
     */
    static async get(key: string): Promise<any> {
        this.ensure(key);
        return this.pool.get(key)!;
    }
}
