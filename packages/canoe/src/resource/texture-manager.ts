import * as THREE from 'three';
import { logger } from '../logger';
import { ManifestManager } from './manifest-manager';
import { loadJson } from '../utils/loadFile';
import type { TextureIR } from '@shxnovel/schema';

export class TextureManager {
    static loader = new THREE.TextureLoader();

    static asset_base = '/assets/texture';
    static world_base = '/game';

    static pool = new Map<string, Promise<THREE.Texture>>();

    /**
     * Ensure a texture is loaded. Supports both raw assets and world-defined textures.
     * @param key - File name (e.g., 'p0.png') or World texture name (e.g., 'tex_p0')
     */
    static ensure(key: string | { name: string }): void {
        const actualKey = typeof key === 'string' ? key : key.name;

        if (this.pool.has(actualKey)) {
            logger.debug(`Hit cache for texture: ${actualKey}`);
            return;
        }

        const loadingTask = (async () => {
            const manifest = await ManifestManager.getCommonManifest();
            const resource = manifest.resourceList[actualKey];

            if (resource && resource.type === 'texture') {
                // Load from WorldIR
                const irPath = `${this.world_base}/${resource.path}`;
                const ir = await loadJson<TextureIR>(irPath);

                // Assuming ir.variants is a single key for now if it's not an object
                // In a real VN, we might need to handle variants properly
                const textureFile =
                    typeof ir.variants === 'string'
                        ? ir.variants
                        : (ir.variants as any).default || Object.values(ir.variants as Record<string, any>)[0];

                const src = `${this.asset_base}/${textureFile}`;
                const tex = await this.loader.loadAsync(src);

                if (ir.srgb) {
                    tex.colorSpace = THREE.SRGBColorSpace;
                }
                if (ir.mipmap) {
                    tex.generateMipmaps = ir.mipmap;
                }

                tex.name = actualKey;

                return tex;
            } else {
                // Direct asset load
                const src = `${this.asset_base}/${actualKey}`;
                return this.loader.loadAsync(src);
            }
        })().catch((err) => {
            this.pool.delete(actualKey);
            logger.error(`Failed to load texture ${actualKey}:`, err);
            throw err;
        });

        this.pool.set(actualKey, loadingTask);
        logger.debug(`Loading cache for texture: ${actualKey}`);
    }

    /**
     * Get a texture
     * @param key - File name or World texture name
     */
    static async get(key: string | { name: string }): Promise<THREE.Texture> {
        this.ensure(key);
        const actualKey = typeof key === 'string' ? key : key.name;
        return this.pool.get(actualKey)!;
    }
}
