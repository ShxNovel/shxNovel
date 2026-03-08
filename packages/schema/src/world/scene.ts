export interface SceneHandle<T extends string = any> {
    name: `s_${T}`;
    type: "scene";
}

export interface SceneIR {
    name: `s_${string}`;
    type: "scene";
}