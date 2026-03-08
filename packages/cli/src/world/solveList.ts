export function solveList(registry: typeof import('@shxnovel/world').registry) {
    const result = {
        texture: {} as Record<string, any>,
        rt: {} as Record<string, any>,
        camera: {} as Record<string, any>,
        scene: {} as Record<string, any>,
        visual: {} as Record<string, any>,
        pipeline: {} as Record<string, any>,
        shader: {} as Record<string, any>,
        data: {} as Record<string, any>,
    };

    registry.TextureRegistry.finish().forEach((item, name) => {
        result.texture[name] = item;
    });

    registry.RTRegistry.finish().forEach((item, name) => {
        result.rt[name] = item;
    });

    registry.CameraRegistry.finish().forEach((item, name) => {
        result.camera[name] = item;
    });

    registry.SceneRegistry.finish().forEach((item, name) => {
        result.scene[name] = item;
    });

    registry.VisualRegistry.finish().forEach((item, name) => {
        result.visual[name] = item;
    });

    registry.PipelineRegistry.finish().forEach((item, name) => {
        result.pipeline[name] = item;
    });

    registry.ShaderRegistry.finish().forEach((item, name) => {
        result.shader[name] = item;
    });

    result.data['inGame'] = registry.InGameData;
    result.data['global'] = registry.GlobalData;

    return result;
}
