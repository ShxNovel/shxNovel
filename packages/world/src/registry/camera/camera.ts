import { OrthographicCameraIR, CameraHandle } from '@shxnovel/schema'
import { CameraRegistry } from './registry';

class defaultCamera implements OrthographicCameraIR {
    constructor(name: OrthographicCameraIR['name']) {
        this.name = name;
    }

    name: OrthographicCameraIR['name'] = 'c_any';
    type: OrthographicCameraIR['type'] = 'camera';
    kind: OrthographicCameraIR['kind'] = 'orthographic';

    left = -960;
    right = 960;
    top = 540;
    bottom = -540;

    near = 0.1;
    far = 2000;

    zoom = 1;
}

export function regCamera<T extends string>(
    name: T,
    config?: (t: Omit<OrthographicCameraIR, 'name' | 'kind'>) => void
): CameraHandle<T> {

    if (name.length === 0) throw new Error('Camera name cannot be empty');

    const Ex_name: CameraHandle<T>['name'] = `c_${name}`;

    const item = new defaultCamera(Ex_name);

    if (config) config(item);

    CameraRegistry.reg(Ex_name, item);

    return { type: 'camera', kind: item.kind, name: Ex_name };
}
