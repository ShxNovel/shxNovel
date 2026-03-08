export type UniformValue =
    | NumberUniform
    | ColorUniform
    | Vec2Uniform
    | Vec3Uniform
    | Vec4Uniform
    | TextureUniform;

export interface NumberUniform {
    type: 'number';
    value: number;
}

export interface ColorUniform {
    type: 'color';
    value: number;
}

export interface Vec2Uniform {
    type: 'vec2';
    value: [number, number];
}

export interface Vec3Uniform {
    type: 'vec3';
    value: [number, number, number];
}

export interface Vec4Uniform {
    type: 'vec4';
    value: [number, number, number, number];
}

export interface TextureUniform {
    type: 'texture';
    value: string | null;
}