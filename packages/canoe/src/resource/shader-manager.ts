import { logger } from '../logger';
import { ManifestManager } from './manifest-manager';
import { loadJson } from '../utils/loadFile';
import type { ShaderIR } from '@shxnovel/schema';

export interface ShaderResource {
    name: string;
    code: string;
}

export class ShaderManager {
    static world_base = '/game';

    static pool = new Map<string, Promise<ShaderResource>>();

    /**
     * Ensure a shader is loaded.
     * @param key - World shader name (e.g., 'sh_autoFragment')
     */
    static ensure(key: string | { name: string }): void {
        const actualKey = typeof key === 'string' ? key : key.name;

        if (this.pool.has(actualKey)) {
            logger.debug(`Hit cache for shader: ${actualKey}`);
            return;
        }

        const loadingTask = (async () => {
            const manifest = await ManifestManager.getCommonManifest();
            const resource = manifest.resourceList[actualKey];

            if (resource && resource.type === 'shader') {
                const irPath = `${this.world_base}/${resource.path}`;
                const ir = await loadJson<ShaderIR>(irPath);

                const result: ShaderResource = {
                    name: ir.name,
                    code: ir.code
                };

                return result;
            } else {
                throw new Error(`Shader resource not found in manifest: ${actualKey}`);
            }
        })().catch((err) => {
            this.pool.delete(actualKey);
            logger.error(`Failed to load shader ${actualKey}:`, err);
            throw err;
        });

        this.pool.set(actualKey, loadingTask);
        logger.debug(`Loading cache for shader: ${actualKey}`);
    }

    /**
     * Get a shader resource
     * @param key - World shader name
     */
    static async get(key: string | { name: string }): Promise<ShaderResource> {
        this.ensure(key);
        const actualKey = typeof key === 'string' ? key : key.name;
        return this.pool.get(actualKey)!;
    }
}
