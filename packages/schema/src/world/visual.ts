import { UniformValue } from "../utils";
import { TextureHandle } from "./texture";

export interface VisualHandle<T extends string = any> {
    name: `v_${T}`;
    type: 'visual';
}

export interface VisualIR {
    name: `v_${string}`;
    type: 'visual';
    nodes: { [nodeName: string]: VisualNodeIR; };
    exprs: VisualExpressionsIR;
}

export type VisualNodeIR = {
    parent: string | 'root';
    variants: {
        [variantName: string]: VisualNodeVariantIR;
    };

    pos: [number, number, number?];
    size?: [number, number];

    uniforms: Record<string, UniformValue>;
    vertexShader: string;
    fragmentShader: string;
}

export type VisualNodeVariantIR = {
    use: TextureHandle<any>;
    size?: [number, number];
}

export type VisualExpressionsIR = {
    [expressionName: string]: {
        target: string | 'self';
        visible?: boolean;
        variant?: string;
        uniforms?: Record<string, number>;
    }
};