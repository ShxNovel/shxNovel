import * as THREE from 'three';
import { RTManager } from '../resource';
import { MainRenderer } from './main-renderer';
import { logger } from '../logger';

class FinalPass {
    private scene: THREE.Scene;
    private camera: THREE.OrthographicCamera;
    private quad: THREE.Mesh;
    private material: THREE.MeshBasicMaterial;

    private targetWidth = 1920;
    private targetHeight = 1080;

    constructor() {
        this.scene = new THREE.Scene();
        // Standard full-screen quad camera
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        this.material = new THREE.MeshBasicMaterial({
            transparent: true,
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        this.quad = new THREE.Mesh(geometry, this.material);
        this.scene.add(this.quad);
    }

    /**
     * Initialize the final pass with RT
     */
    async init() {
        const rt = await RTManager.get('rt_screen');
        this.material.map = rt.texture;
        this.targetWidth = rt.width;
        this.targetHeight = rt.height;

        // Force an immediate sync of renderer size and viewport
        this.resize();
        logger.info(`[FinalPass] Initialized with target ${this.targetWidth}x${this.targetHeight}`);
    }

    /**
     * Calculate scaling and viewports to keep aspect ratio with black bars
     */
    resize(width: number = window.innerWidth, height: number = window.innerHeight) {

        const targetAspect = this.targetWidth / this.targetHeight;
        const windowAspect = width / height;

        let renderWidth, renderHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (windowAspect > targetAspect) {
            // Window is wider than target - pillarbox
            renderHeight = height;
            renderWidth = height * targetAspect;
            offsetX = (width - renderWidth) / 2;
        } else {
            // Window is taller than target - letterbox
            renderWidth = width;
            renderHeight = width / targetAspect;
            offsetY = (height - renderHeight) / 2;
        }

        MainRenderer.setSize(width, height);

        // We will apply this viewport during render
        this.lastViewport = new THREE.Vector4(offsetX, offsetY, renderWidth, renderHeight);
        this.fullWindowViewport = new THREE.Vector4(0, 0, width, height);

        MainRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    private lastViewport = new THREE.Vector4(0, 0, 1920, 1080);
    private fullWindowViewport = new THREE.Vector4(0, 0, 1920, 1080);

    render(renderer: THREE.WebGLRenderer) {
        if (!this.material.map) return;

        // 1. Render to screen (null target)
        renderer.setRenderTarget(null);

        // 2. Clear entire window with black (for bars)
        renderer.setViewport(this.fullWindowViewport);
        renderer.setScissorTest(false);
        renderer.setClearColor(0x000000, 1);
        renderer.clear();

        // 3. Render the 1920x1080 RT into the correctly aspect-scaled viewport
        renderer.setViewport(this.lastViewport);
        renderer.render(this.scene, this.camera);
    }
}

export const finalPass = new FinalPass();
