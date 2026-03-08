export interface PipelineHandle<T extends string = any> {
    name: `pipe_${T}`;
    type: 'pipeline';
}

export interface PipelineIR {
    name: `pipe_${string}`;
    type: 'pipeline';

    steps: PipelineContent[];
}

type Vector4 = [number, number, number, number];

export interface PipelineContent {
    scene: string;
    camera: string;
    // will we support Multiple Render Targets?
    // [string, ...string[]];
    output: string;

    clear: boolean;
    clearColor: string;
    clearAlpha: number;

    viewport: Vector4;
    scissor: Vector4;
    scissorTest: boolean;
}