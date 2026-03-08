import { TextureIR, TextureHandle } from '@shxnovel/schema';
import { TextureRegistry } from './registry';

class defaultTexture implements TextureIR {
    constructor(name: TextureIR['name']) {
        if (name.length === 0) {
            throw new Error('Texture name cannot be empty');
        }
        this.name = name;
    }

    name: TextureIR['name'] = 'tex_any';
    type: TextureIR['type'] = 'texture';

    variants = {};
    srgb = true;
    mipmap = false;
}


export function regTexture<T extends string>(name: T, config: (t: Omit<TextureIR, 'name'>) => void): TextureHandle<T> {
    if (name.length === 0) throw new Error('Texture name cannot be empty');

    const Ex_name: TextureHandle<T>['name'] = `tex_${name}`;

    const item = new defaultTexture(Ex_name);

    config(item);

    TextureRegistry.reg(Ex_name, item);

    return { type: 'texture', name: Ex_name };
}
