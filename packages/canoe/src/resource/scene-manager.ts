import * as THREE from 'three';
import { logger } from '../logger';
import { WorldManager } from './world-manager';
import type { SceneIR } from '@shxnovel/schema';

export class SceneManager {
    static pool = new Map<string, Promise<THREE.Scene>>();

    /**
     * Ensure a scene is loaded/created
     * @param key - The scene name in manifest
     */
    static ensure(key: string): void {
        if (this.pool.has(key)) {
            logger.debug(`Hit cache for scene: ${key}`);
            return;
        }

        const loadingTask = (async () => {
            const ir = await WorldManager.get<SceneIR>(key);
            
            if (ir.type !== 'scene') {
                throw new Error(`Resource ${key} is not a scene`);
            }

            const scene = new THREE.Scene();
            scene.name = ir.name;

            return scene;
        })().catch((err) => {
            this.pool.delete(key);
            logger.error(`Failed to create scene ${key}:`, err);
            throw err;
        });

        this.pool.set(key, loadingTask);
        logger.debug(`Loading cache for scene: ${key}`);
    }

    /**
     * Get a scene instance
     * @param key - The scene name in manifest
     */
    static async get(key: string): Promise<THREE.Scene> {
        this.ensure(key);
        return this.pool.get(key)!;
    }
}
