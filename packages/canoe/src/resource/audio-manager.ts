import * as THREE from 'three';
import { logger } from '../logger';

export class AudioManager {
    static loader = new THREE.AudioLoader();

    static base = '/assets/audio';

    static pool = new Map<string, Promise<AudioBuffer>>();

    /**
     * Ensure an audio resource is loaded
     * @param key - The audio file path relative to base
     */
    static ensure(key: string): void {
        if (this.pool.has(key)) {
            logger.debug(`Hit cache for audio: ${key}`);
            return;
        }

        const src = `${this.base}/${key}`;

        const loadingTask = this.loader.loadAsync(src).catch((err) => {
            this.pool.delete(key);
            logger.error(`Failed to load audio ${key}:`, err);
            throw err;
        });

        this.pool.set(key, loadingTask);
        logger.debug(`Loading cache for audio: ${key}`);
    }

    /**
     * Get an audio buffer
     * @param key - The audio file path relative to base
     */
    static async get(key: string): Promise<AudioBuffer> {
        this.ensure(key);
        return this.pool.get(key)!;
    }
}
