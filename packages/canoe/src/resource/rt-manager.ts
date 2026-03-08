import * as THREE from 'three';
import { logger } from '../logger';
import { WorldManager } from './world-manager';

export class RTManager {
    static pool = new Map<string, Promise<THREE.WebGLRenderTarget>>();

    /**
     * Ensure a render target is loaded/created
     * @param key - The RT name in manifest
     */
    static ensure(key: string): void {
        if (this.pool.has(key)) {
            logger.debug(`Hit cache for render target: ${key}`);
            return;
        }

        const loadingTask = (async () => {
            const ir = await WorldManager.get(key);
            
            if (ir.kind !== 'RT') {
                throw new Error(`Resource ${key} is not a render target`);
            }

            const rt = new THREE.WebGLRenderTarget(
                ir.width || 1920,
                ir.height || 1080,
                {
                    minFilter: THREE.LinearFilter,
                    magFilter: THREE.LinearFilter,
                    samples: ir.samples || 0,
                    depthBuffer: ir.depth !== undefined ? !!ir.depth : true,
                }
            );
            
            return rt;
        })().catch((err) => {
            this.pool.delete(key);
            logger.error(`Failed to create render target ${key}:`, err);
            throw err;
        });

        this.pool.set(key, loadingTask);
        logger.debug(`Loading cache for render target: ${key}`);
    }

    /**
     * Get a render target instance
     * @param key - The RT name in manifest
     */
    static async get(key: string): Promise<THREE.WebGLRenderTarget> {
        this.ensure(key);
        return this.pool.get(key)!;
    }
}
