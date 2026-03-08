import { engine } from 'animejs';
import * as THREE from 'three';
import { renderScheduler } from './render-scheduler';
import { finalPass } from './final-pass';
import { Pipeline } from '../object/pipeline';
import { MainRenderer } from './main-renderer';
import { CameraManager, SceneManager } from '../resource';

class RenderLoop {
    loopBlock = false;
    private controls: any = null;

    setPipeline(name: string) {
        Pipeline.use(name);
    }

    /**
     * Enable debug OrbitControls for a camera
     */
    async enableOrbit(cameraName: string = 'co_main') {
        const canoeCam = await CameraManager.get(cameraName);
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

        this.controls = new OrbitControls(canoeCam.cam, MainRenderer.domElement);
        console.log(`[Debug] OrbitControls enabled for ${cameraName}`);

        this.controls.addEventListener('change', () => {
            renderScheduler.requestRender();
        });
    }

    /**
     * Inject test objects into s_main
     */
    async debugPopulate() {
        const scene = await SceneManager.get('s_main');

        // 1. Add Grid Helper
        const grid = new THREE.GridHelper(2000, 20);
        grid.rotation.x = Math.PI / 2;
        scene.add(grid);

        // 2. Add Axis Helper
        const axes = new THREE.AxesHelper(500);
        scene.add(axes);

        // 3. Add colorful cubes
        const geometries = [
            { pos: [0, 0, 0], color: 0xff0000 },
            { pos: [500, 0, 0], color: 0x00ff00 },
            { pos: [-500, 0, 0], color: 0x0000ff },
            { pos: [0, 500, 0], color: 0xffff00 },
        ];

        geometries.forEach(g => {
            const cube = new THREE.Mesh(
                new THREE.BoxGeometry(100, 100, 100),
                new THREE.MeshBasicMaterial({ color: g.color })
            );
            cube.position.set(g.pos[0], g.pos[1], g.pos[2]);
            scene.add(cube);
        });

        console.log('[Debug] Scene s_main populated');
        renderScheduler.requestRender();
    }

    /**
     * Directly load a texture and add it to s_main
     */
    async debugImage(path: string = 'tex_p0') {
        const { TextureManager } = await import('../resource/texture-manager');
        const scene = await SceneManager.get('s_main');

        console.log(`[Debug] Loading image directly: ${path}`);
        const tex = await TextureManager.get(path);

        //@ts-ignore
        const geometry = new THREE.PlaneGeometry(tex.image.width || 500, tex.image.height || 500);
        const material = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0, 10); // Offset a bit to avoid z-fighting with grid
        scene.add(mesh);

        console.log(`[Debug] Direct mesh added to s_main at (0, 0, 10), size: ${geometry.parameters.width}x${geometry.parameters.height}`);
        renderScheduler.requestRender();
    }

    /**
     * Test a VisualObject by adding it to s_main
     */
    async debugVisual(visualName: string = 'v_bg') {
        const { VisualManager } = await import('../resource/visual-manager');
        const scene = await SceneManager.get('s_main');

        console.log(`[Debug] Creating visual: ${visualName}`);
        const visual = await VisualManager.get(visualName);

        visual.position.set(0, 0, 20); // Slightly in front
        scene.add(visual);

        // Ensure it's visible and opaque
        visual.visible = true;
        visual.opacity = 1;

        console.log(`[Debug] Visual ${visualName} added to s_main. Current Pos:`, visual.position);
        renderScheduler.requestRender();
    }

    /**
     * List and apply expressions for a VisualObject
     */
    async debugExpr(visualName: string, exprName?: string) {
        const { VisualManager } = await import('../resource/visual-manager');
        const visual = await VisualManager.get(visualName);

        // @ts-ignore - Access private exprMap for debugging
        const available = Array.from(visual.exprMap.keys());
        console.log(`[Debug] Visual ${visualName} available expressions:`, available);

        if (exprName) {
            console.log(`[Debug] Applying expression: ${exprName}`);
            const res = await visual.applyExpression(exprName, {
                duration: 1,
            });

            if (res?.anim) {
                // If it's a timeline, play it immediately
                res.anim.play();
                console.log(`[Debug] Expression animation started`);
            } else {
                console.warn(`[Debug] Expression ${exprName} returned no animation`);
            }
        }

        renderScheduler.requestRender();
    }

    loop(_t: number) {
        engine.update();

        if (this.controls) {
            this.controls.update();
        }

        if (this.loopBlock) return;

        if (!renderScheduler.shouldRender()) return;

        renderScheduler.consume();

        Pipeline.render(MainRenderer);

        // Always render final pass to screen
        finalPass.render(MainRenderer);
    }
}

export const renderLoop = new RenderLoop();
// @ts-ignore
window.renderLoop = renderLoop;
