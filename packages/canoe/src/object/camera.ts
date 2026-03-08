import * as THREE from 'three';
import { createTimeline, type Timeline } from 'animejs';
import { renderScheduler } from '../core/render-scheduler';
import { proxyProp } from '../utils/decorators';

/**
 * Base Rig for all Canoe Cameras
 * Separates Panning (Group) from Shake/Zoom (Internal Camera)
 */
export abstract class AbstractCanoeCamera<T extends THREE.Camera> extends THREE.Group {
    public abstract cam: T;

    // --- Rig Proxies (Outer Movement) ---
    @proxyProp('position.x') x!: number;
    @proxyProp('position.y') y!: number;
    @proxyProp('position.z') z!: number;

    constructor(public name: string) {
        super();
    }

    /**
     * Manually update world matrices for the camera and its rig.
     * Essential because the camera might not be added to the scene tree.
     */
    updateMatrices() {
        this.updateMatrixWorld(true);
        this.cam.updateMatrixWorld(true);
    }

    /**
     * Camera Shake Effect
     * @param intensity - Shake intensity
     * @param duration - Total duration in milliseconds (default 500ms)
     */
    shake(intensity: number, duration: number = 500): Timeline {
        const tl = createTimeline({
            autoplay: false,
        });

        // Loop individual shake steps
        tl.add(this.cam.position, {
            x: () => (Math.random() * 2 - 1) * intensity,
            y: () => (Math.random() * 2 - 1) * intensity,
            duration: 50,
            loop: Math.max(1, Math.floor(duration / 50)),
            alternate: true,
        });

        // Reset to center
        tl.add(this.cam.position, {
            x: 0,
            y: 0,
            duration: 50,
        });

        return tl;
    }

    /**
     * Set Camera Zoom (Abstract)
     * @param value - Target zoom value
     * @param duration - Duration in milliseconds
     * @param ease - Easing function name
     */
    abstract setZoom(value: number, duration: number, ease?: string): Timeline;

    getState() {
        return {
            name: this.name,
            position: [this.position.x, this.position.y, this.position.z],
            rotation: [this.rotation.x, this.rotation.y, this.rotation.z],
            camPosition: [this.cam.position.x, this.cam.position.y, this.cam.position.z],
            zoom: (this.cam as any).zoom || 1,
        };
    }

    recover(state: any) {
        this.position.set(state.position[0], state.position[1], state.position[2]);
        this.rotation.set(state.rotation[0], state.rotation[1], state.rotation[2]);
        this.cam.position.set(state.camPosition[0], state.camPosition[1], state.camPosition[2]);
        if ((this.cam as any).zoom !== undefined) {
            (this.cam as any).zoom = state.zoom || 1;
            (this.cam as any).updateProjectionMatrix();
        }
        this.updateMatrices();
        renderScheduler.requestRender();
    }
}

export class CanoeOrthographicCamera extends AbstractCanoeCamera<THREE.OrthographicCamera> {
    public cam: THREE.OrthographicCamera;

    constructor(
        name: string,
        params: {
            left?: number;
            right?: number;
            top?: number;
            bottom?: number;
            near?: number;
            far?: number;
            aspect?: number;
        } = {}
    ) {
        super(name);
        const aspect = params.aspect || 16 / 9;
        const h = 1080;
        const w = h * aspect;

        this.cam = new THREE.OrthographicCamera(
            params.left ?? -w / 2,
            params.right ?? w / 2,
            params.top ?? h / 2,
            params.bottom ?? -h / 2,
            params.near ?? 0.1,
            params.far ?? 20000
        );
        this.add(this.cam);
        this.z = 1000;
    }

    setZoom(value: number, duration: number = 0, ease: string = 'inOutQuad'): Timeline {
        const tl = createTimeline({ autoplay: false });
        
        tl.add(this.cam, {
            zoom: value,
            duration: Math.max(0, duration),
            ease,
            onUpdate: () => {
                this.cam.updateProjectionMatrix();
            },
        });

        return tl;
    }
}

export class CanoePerspectiveCamera extends AbstractCanoeCamera<THREE.PerspectiveCamera> {
    public cam: THREE.PerspectiveCamera;

    constructor(
        name: string,
        params: {
            fov?: number;
            aspect?: number;
            near?: number;
            far?: number;
        } = {}
    ) {
        super(name);
        this.cam = new THREE.PerspectiveCamera(
            params.fov ?? 45,
            params.aspect ?? 16 / 9,
            params.near ?? 0.1,
            params.far ?? 20000
        );
        this.add(this.cam);
        this.z = 1000;
    }

    setZoom(value: number, duration: number = 0, ease: string = 'inOutQuad'): Timeline {
        const tl = createTimeline({ autoplay: false });

        tl.add(this.cam, {
            zoom: value,
            duration: Math.max(0, duration),
            ease,
            onUpdate: () => {
                this.cam.updateProjectionMatrix();
            },
        });

        return tl;
    }
}
