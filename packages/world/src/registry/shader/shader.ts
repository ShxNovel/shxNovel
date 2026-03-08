import { ShaderIR, ShaderHandle } from '@shxnovel/schema';
import { ShaderRegistry } from './registry';

class defaultShader implements ShaderIR {
    constructor(name: ShaderIR['name']) {
        this.name = name;
    }

    name: ShaderIR['name'] = 'sh_any';
    type: ShaderIR['type'] = 'shader';

    code = '';
}

export function regShader<T extends string>(name: T, config: (t: Omit<ShaderIR, 'name'>) => void): ShaderHandle<T> {
    if (name.length === 0) throw new Error('Shader name cannot be empty');

    const Ex_name: ShaderHandle<T>['name'] = `sh_${name}`;

    const item = new defaultShader(Ex_name);

    config(item);

    ShaderRegistry.reg(Ex_name, item);

    return { type: 'shader', name: Ex_name };
}