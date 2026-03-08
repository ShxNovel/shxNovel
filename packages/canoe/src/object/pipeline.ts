import * as THREE from 'three';
import { SceneManager, CameraManager, RTManager, PipelineManager } from '../resource';
import { AbstractCanoeCamera } from './camera';

/**
 * {@link PipelineStep} represents a single step in the rendering pipeline
 */
export interface PipelineStep {
    scene: THREE.Scene;
    canoeCamera: AbstractCanoeCamera<any>;
    output: THREE.WebGLRenderTarget | null;
    clear: boolean;
    clearColor: THREE.Color;
    clearAlpha: number;
    viewport: THREE.Vector4;
    scissor: THREE.Vector4;
    scissorTest: boolean;
}

/**
 * Singleton pipeline class
 */
export class Pipeline {
    public static pipe_name: string = 'pipe_main';
    public static steps: PipelineStep[] = [];

    static use(name: string) {
        this.pipe_name = name;
    }

    /**
     * Build pipeline from IR
     */
    static async build() {
        const ir = await PipelineManager.get(this.pipe_name);

        this.steps = await Promise.all(
            ir.steps.map(async (step: any) => {
                const [scene, canoeCamera, output] = await Promise.all([
                    SceneManager.get(step.scene),
                    CameraManager.get(step.camera),
                    RTManager.get(step.output), // always output to rt
                ]);

                return {
                    scene,
                    canoeCamera,
                    output,
                    clear: step.clear ?? true,
                    clearColor: new THREE.Color(step.clearColor || 0x000000),
                    clearAlpha: step.clearAlpha ?? 1,
                    viewport: new THREE.Vector4(...(step.viewport || [0, 0, output?.width || 1920, output?.height || 1080])),
                    scissor: new THREE.Vector4(...(step.scissor || [0, 0, output?.width || 1920, output?.height || 1080])),
                    scissorTest: step.scissorTest ?? false,
                };
            })
        );
    }

    /**
     * Render the pipeline
     */
    static render(renderer: THREE.WebGLRenderer) {
        const originalPixelRatio = renderer.getPixelRatio();

        for (const step of this.steps) {
            // CRITICAL: When rendering to a RenderTarget, we must use a 1:1 pixel ratio 
            // to ensure the viewport matches the RT's physical dimensions.
            renderer.setPixelRatio(1);
            renderer.setRenderTarget(step.output);

            renderer.setViewport(step.viewport);
            renderer.setScissor(step.scissor);
            renderer.setScissorTest(step.scissorTest);

            if (step.clear) {
                renderer.setClearColor(step.clearColor, step.clearAlpha);
                renderer.clear();
            }

            // CRITICAL: Update camera matrices before render because they are not in the scene tree
            step.canoeCamera.updateMatrices();

            renderer.render(step.scene, step.canoeCamera.cam);
        }

        // Restore original ratio for screen-space rendering (FinalPass)
        renderer.setPixelRatio(originalPixelRatio);
    }
}
