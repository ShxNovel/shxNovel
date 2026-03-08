export interface ShaderHandle<T extends string = any> {
    name: `sh_${T}`;
    type: "shader";
}

export interface ShaderIR {
    name: `sh_${string}`;
    type: "shader";
    code: string;
}