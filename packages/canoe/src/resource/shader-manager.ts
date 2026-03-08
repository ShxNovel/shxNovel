import * as THREE from 'three';
import { logger } from '../logger';
import { ManifestManager } from './manifest-manager';
import { loadJson } from '../utils/loadFile';
import { deserializeUniformValue } from '../utils/serialization';
import type { ShaderIR } from '@shxnovel/schema';

export interface ShaderResource {
    name: string;
    vertexShader: string;
    fragmentShader: string;
    uniforms: Record<string, THREE.IUniform>;
}

export class ShaderManager {
    static world_base = '/game';

    static pool = new Map<string, Promise<ShaderResource>>();

    /**
     * Ensure a shader is loaded.
     * @param key - World shader name (e.g., 'sh_defaultNode')
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

                const uniforms: Record<string, THREE.IUniform> = {};
                const promises: Promise<void>[] = [];

                for (const [uName, uData] of Object.entries(ir.uniforms)) {
                    // Create a placeholder uniform
                    const uniform: THREE.IUniform = { value: null };
                    uniforms[uName] = uniform;

                    if (uData.type === 'texture' && uData.value === null) {
                        // Keep value as null
                        continue;
                    }

                    // For other types (or non-null textures), try to deserialize
                    promises.push(deserializeUniformValue(uniform, uData as any));
                }

                await Promise.all(promises);

                const result: ShaderResource = {
                    name: ir.name,
                    vertexShader: ir.vertex,
                    fragmentShader: ir.fragment,
                    uniforms: uniforms
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
