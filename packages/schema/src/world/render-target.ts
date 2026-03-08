export interface RenderTargetHandle<T extends string = any> {
    name: `rt_${T}`;
    type: "render-target";
    width: number;
    height: number;
}

export interface RenderTargetIR extends RenderTargetArgs {
    name: `rt_${string}`;
    type: "render-target";
}

export interface RenderTargetArgs {
    width?: number;
    height?: number;
    depth?: number;

    samples?: number;
}