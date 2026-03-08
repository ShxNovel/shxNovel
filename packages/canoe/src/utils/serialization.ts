import * as THREE from 'three';
import { isColor, isTexture, isVector2, isVector3, isVector4 } from './typeCheck';
import { TextureManager } from '../resource/texture-manager';

export interface SerializedUniform {
    type: string;
    value: any;
}

export function serializeUniformValue(val: any): SerializedUniform | null {
    if (typeof val === 'number') {
        return { type: 'number', value: val };
    } else if (isColor(val)) {
        return { type: 'color', value: val.getHex() };
    } else if (isVector2(val)) {
        return { type: 'vec2', value: [val.x, val.y] };
    } else if (isVector3(val)) {
        return { type: 'vec3', value: [val.x, val.y, val.z] };
    } else if (isVector4(val)) {
        return { type: 'vec4', value: [val.x, val.y, val.z, val.w] };
    } else if (isTexture(val)) {
        return { type: 'texture', value: val.name };
    }
    return null;
}

export async function deserializeUniformValue(
    uniform: THREE.IUniform,
    data: SerializedUniform
): Promise<void> {
    const { type, value } = data;

    if (type === 'texture') {
        const tex = await TextureManager.get(value);
        uniform.value = tex;
        return;
    }

    if (type === 'number') {
        uniform.value = value;
        return;
    }

    // For object types, ensure instance exists
    if (type === 'color') {
        if (!isColor(uniform.value)) uniform.value = new THREE.Color();
        uniform.value.setHex(value);
    } else if (type === 'vec2') {
        if (!isVector2(uniform.value)) uniform.value = new THREE.Vector2();
        if (Array.isArray(value)) uniform.value.set(value[0], value[1]);
    } else if (type === 'vec3') {
        if (!isVector3(uniform.value)) uniform.value = new THREE.Vector3();
        if (Array.isArray(value)) uniform.value.set(value[0], value[1], value[2]);
    } else if (type === 'vec4') {
        if (!isVector4(uniform.value)) uniform.value = new THREE.Vector4();
        if (Array.isArray(value)) uniform.value.set(value[0], value[1], value[2], value[3]);
    }
}
