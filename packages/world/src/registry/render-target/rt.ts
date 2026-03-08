import { RenderTargetIR, RenderTargetHandle } from '@shxnovel/schema';
import { RTRegistry } from './registry';

class defaultRT implements RenderTargetIR {
    constructor(name: RenderTargetIR['name']) {
        this.name = name;
    }

    name: RenderTargetIR['name'] = 'rt_any';
    type: RenderTargetIR['type'] = 'render-target';

    width = 1920;
    height = 1080;
    depth = 1;

    samples = 0;
}


export function regRT<T extends string>(name: T, config?: (t: Omit<RenderTargetIR, 'name'>) => void): RenderTargetHandle<T> {

    if (name.length === 0) throw new Error('RenderTarget name cannot be empty');

    const Ex_name: RenderTargetHandle<T>['name'] = `rt_${name}`;

    const item = new defaultRT(Ex_name);

    if (config) config(item);

    RTRegistry.reg(Ex_name, item);

    return {
        type: "render-target", name: Ex_name, width: item.width, height: item.height
    } satisfies RenderTargetHandle<T>;
}
