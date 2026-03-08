import { TextureKey } from "../hint-world";

export interface TextureHandle<T extends string = any> {
    name: `tex_${T}`;
    type: "texture";
}

export type TextureIR = {
    name: `tex_${string}`;
    type: "texture";
    variants: TextureKey | Record<string, TextureKey>;
    srgb: boolean;
    mipmap: boolean;
};