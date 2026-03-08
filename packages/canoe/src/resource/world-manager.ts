import { logger } from '../logger';
import { loadJson } from '../utils/loadFile';
import { ManifestManager } from './manifest-manager';

export class WorldManager {
    static pool = new Map<string, Promise<any>>();

    static base = '/game';

    /**
     * Ensure a world resource IR is loaded
     * @param key - The resource name in manifest
     */
    static ensure(key: string): void {
        if (this.pool.has(key)) {
            logger.debug(`Hit cache for world resource: ${key}`);
            return;
        }

        const loadingTask = (async () => {
            const manifest = await ManifestManager.getCommonManifest();
            const resource = manifest.resourceList[key];

            if (!resource) {
                const err = `Resource ${key} not found in manifest`;
                logger.error(err);
                throw new Error(err);
            }

            const src = `${this.base}/${resource.path}`;
            return loadJson(src).catch((err) => {
                this.pool.delete(key);
                logger.error(`Failed to load world resource ${key} from ${src}:`, err);
                throw err;
            });
        })();

        this.pool.set(key, loadingTask);
        logger.debug(`Loading cache for world resource: ${key}`);
    }

    /**
     * Get a world resource IR
     * @param key - The resource name in manifest
     */
    static async get<T = any>(key: string): Promise<T> {
        this.ensure(key);
        return this.pool.get(key)!;
    }
}
