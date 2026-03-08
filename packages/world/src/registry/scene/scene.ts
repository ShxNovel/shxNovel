import { SceneIR, SceneHandle } from "@shxnovel/schema";
import { SceneRegistry } from './registry';

class defaultScene implements SceneIR {
    constructor(name: SceneIR['name']) {
        this.name = name;
    }

    name: SceneIR['name'] = 's_default';
    type: SceneIR['type'] = 'scene';
}

export function regScene<T extends string>(name: T): SceneHandle<T> {
    if (name.length === 0) throw new Error('Scene name cannot be empty');

    const Ex_name: SceneHandle<T>['name'] = `s_${name}`;

    const item = new defaultScene(Ex_name);

    SceneRegistry.reg(Ex_name, item);

    return { type: 'scene', name: Ex_name };
}