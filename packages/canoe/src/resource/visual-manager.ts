import { logger } from '../logger';
import { WorldManager } from './world-manager';
import { VisualObject } from '../object/visual-object';

export class VisualManager {
    private static irPool = new Map<string, Promise<any>>();
    private static instancePool = new Map<string, VisualObject>();

    /**
     * Ensure a visual IR is loaded
     */
    static ensure(key: string): void {
        if (this.irPool.has(key)) {
            logger.debug(`Hit cache for visual IR: ${key}`);
            return;
        }

        const loadingTask = WorldManager.get(key)
            .then((ir) => {
                if (ir.kind !== 'visual') {
                    throw new Error(`Resource ${key} is not a visual`);
                }
                return ir;
            })
            .catch((err) => {
                this.irPool.delete(key);
                logger.error(`Failed to load visual IR ${key}:`, err);
                throw err;
            });

        this.irPool.set(key, loadingTask);
        logger.debug(`Loading cache for visual IR: ${key}`);
    }

    /**
     * Get a VisualObject instance.
     * If not exists, creates one and loads defaults.
     */
    static async get(key: string): Promise<VisualObject> {
        if (this.instancePool.has(key)) {
            return this.instancePool.get(key)!;
        }

        this.ensure(key);
        const ir = await this.irPool.get(key)!;

        logger.debug(`Creating visual instance: ${key}`);
        const obj = new VisualObject(key, ir);
        await obj.loadDefaults();

        this.instancePool.set(key, obj);
        return obj;
    }

    /**
     * Recover a visual object from state
     */
    static async recover(id: string, state: any) {
        logger.debug(`Recovering visual object: ${id}`);
        const obj = await this.get(id);
        await obj.recover(state);
    }

    /**
     * Get all active instances (useful for SnapshotManager)
     */
    static getInstances() {
        return Array.from(this.instancePool.values());
    }

    /**
     * Clear instances
     */
    static reset() {
        logger.debug('Resetting VisualManager (clearing instances)');
        this.instancePool.clear();
    }
}
