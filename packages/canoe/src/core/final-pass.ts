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

        MainRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    private lastViewport = new THREE.Vector4(0, 0, 1920, 1080);

    render(renderer: THREE.WebGLRenderer) {
        if (!this.material.map) return;

        // Render to screen
        renderer.setRenderTarget(null);

        // CRITICAL: Disable scissor test and ensure we use the full internal canvas resolution
        renderer.setScissorTest(false);

        // Clear background (the black bars)
        renderer.setClearColor(0x000000, 1);
        renderer.clear();

        // Map the 1920x1080 RT to the current viewport (pillarbox/letterbox)
        // Three.js will automatically apply the current pixelRatio to this logical viewport.
        renderer.setViewport(this.lastViewport);
        renderer.render(this.scene, this.camera);
    }
}

export const finalPass = new FinalPass();
