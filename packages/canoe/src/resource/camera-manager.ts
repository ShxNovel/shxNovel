import { logger } from '../logger';
import { WorldManager } from './world-manager';
import { 
    AbstractCanoeCamera, 
    CanoeOrthographicCamera, 
    CanoePerspectiveCamera 
} from '../object/camera';

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
            const ir = await WorldManager.get(key);
            
            let canoeCam: AbstractCanoeCamera<any>;

            if (ir.kind === 'orthographic') {
                canoeCam = new CanoeOrthographicCamera(ir.name, {
                    left: ir.left,
                    right: ir.right,
                    top: ir.top,
                    bottom: ir.bottom,
                    near: ir.near,
                    far: ir.far,
                    aspect: ir.aspect
                });
            } else if (ir.kind === 'perspective') {
                canoeCam = new CanoePerspectiveCamera(ir.name, {
                    fov: ir.fov,
                    aspect: ir.aspect,
                    near: ir.near,
                    far: ir.far
                });
            } else {
                throw new Error(`Resource ${key} is not a camera IR`);
            }

            if (ir.zoom) canoeCam.cam.zoom = ir.zoom;

            // Apply initial state from IR if present
            if (ir.pos) canoeCam.position.set(ir.pos[0], ir.pos[1], ir.pos[2]);
            if (ir.rot) canoeCam.rotation.set(ir.rot[0], ir.rot[1], ir.rot[2]);

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
