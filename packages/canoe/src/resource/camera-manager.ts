import { logger } from '../logger';
import { WorldManager } from './world-manager';
import { 
    AbstractCanoeCamera, 
    CanoeOrthographicCamera, 
    CanoePerspectiveCamera 
} from '../object/camera';
import type { CameraIR } from '@shxnovel/schema';

export class CameraManager {
    static pool = new Map<string, Promise<AbstractCanoeCamera<any>>>();
    static activeCameraName: string = '';

    /**
     * Set the active camera
     */
    static setActive(name: string) {
        this.activeCameraName = name;
    }

    /**
     * Get all currently instantiated cameras
     */
    static async getInstances(): Promise<AbstractCanoeCamera<any>[]> {
        const promises = Array.from(this.pool.values());
        return Promise.all(promises);
    }

    /**
     * Ensure a camera is loaded/created
     * @param key - The camera name in manifest
     */
    static ensure(key: string): void {
        if (this.pool.has(key)) {
            logger.debug(`Hit cache for camera: ${key}`);
            return;
        }

        const loadingTask = (async () => {
            const ir = await WorldManager.get<CameraIR>(key);
            
            if (ir.type !== 'camera') {
                throw new Error(`Resource ${key} is not a camera`);
            }

            let canoeCam: AbstractCanoeCamera<any>;

            if (ir.kind === 'orthographic') {
                canoeCam = new CanoeOrthographicCamera(ir.name, {
                    left: ir.left,
                    right: ir.right,
                    top: ir.top,
                    bottom: ir.bottom,
                    near: ir.near,
                    far: ir.far,
                    // @ts-ignore TODO: add aspect to schema if needed
                    aspect: (ir as any).aspect
                });
            } else if (ir.kind === 'perspective') {
                canoeCam = new CanoePerspectiveCamera(ir.name, {
                    fov: ir.fov,
                    aspect: ir.aspect,
                    near: ir.near,
                    far: ir.far
                });
            } else {
                throw new Error(`Resource ${key} has an unknown camera kind`);
            }

            if (ir.zoom) canoeCam.cam.zoom = ir.zoom;

            // Apply initial state from IR if present
            // @ts-ignore TODO: add pos and rot to schema if needed
            if ((ir as any).pos) canoeCam.position.set((ir as any).pos[0], (ir as any).pos[1], (ir as any).pos[2]);
            // @ts-ignore TODO: add pos and rot to schema if needed
            if ((ir as any).rot) canoeCam.rotation.set((ir as any).rot[0], (ir as any).rot[1], (ir as any).rot[2]);

            canoeCam.cam.updateProjectionMatrix();
            canoeCam.updateMatrices();
            
            return canoeCam;
        })().catch((err) => {
            this.pool.delete(key);
            logger.error(`Failed to create camera ${key}:`, err);
            throw err;
        });

        this.pool.set(key, loadingTask);
        logger.debug(`Loading cache for camera: ${key}`);
    }

    /**
     * Get a camera instance
     * @param key - The camera name in manifest
     */
    static async get(key: string): Promise<AbstractCanoeCamera<any>> {
        this.ensure(key);
        return this.pool.get(key)!;
    }
}
