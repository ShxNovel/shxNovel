import {
    PipelineIR, PipelineContent,
    SceneHandle,
    CameraHandle,
    RenderTargetHandle,
    PipelineHandle,
} from '@shxnovel/schema';

import { PipelineRegistry } from './registry';

class defaultPipeline implements PipelineIR {
    constructor(name: PipelineIR['name']) {
        this.name = name;
    }

    name: PipelineIR['name'] = 'pipe_any';
    type: PipelineIR['type'] = 'pipeline';

    steps = [];
}

type PipelineConfigArgs = {
    scene: SceneHandle<any>;
    camera: CameraHandle<any>;
    output: RenderTargetHandle<any>;
    // will we support (Multiple Render Targets)?
    // [RTHandler<any>, ...RTHandler<any>[]];

    /** @default false */
    clear?: boolean;
    /** @default '#000000' */
    clearColor?: string;
    /** @default 0 */
    clearAlpha?: number;

    /**
     *  @default
     *  [0, 0, output.width, output.height]
     */
    viewport?: PipelineContent['viewport'];
    /**
     *  @default
     *  [0, 0, output.width, output.height]
     */
    scissor?: PipelineContent['scissor'];

    /** @default false */
    scissorTest?: boolean;
};

class PipelineConfig {
    constructor(public content: PipelineContent[]) { }

    add(args: PipelineConfigArgs) {
        const some = structuredClone(args);

        let result: PipelineContent;

        result = {
            scene: some.scene.name,
            camera: some.camera.name,
            output: some.output.name,

            clear: some.clear || true,
            clearColor: some.clearColor || '#000000',
            clearAlpha: some.clearAlpha || 0,

            viewport: some.viewport || [0, 0, some.output.width, some.output.height],
            scissor: some.scissor || [0, 0, some.output.width, some.output.height],
            scissorTest: some.scissorTest || false,
        };
        this.content.push(result);
    }
}


export function regPipeline<T extends string>(name: T, config?: (t: PipelineConfig) => void): PipelineHandle<T> {
    if (name.length === 0) {
        throw new Error('Pipeline name cannot be empty');
    }

    const Ex_name: PipelineHandle<T>['name'] = `pipe_${name}`;

    const item = new defaultPipeline(Ex_name);

    if (config) config(new PipelineConfig(item.steps));

    PipelineRegistry.reg(Ex_name, item);

    return { type: 'pipeline', name: Ex_name };
}
