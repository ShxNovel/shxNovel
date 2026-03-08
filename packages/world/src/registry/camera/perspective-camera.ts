import { PerspectiveCameraIR, CameraHandle } from '@shxnovel/schema'
import { CameraRegistry } from './registry';

class defaultCamera implements PerspectiveCameraIR {
    constructor(name: PerspectiveCameraIR['name']) {

        this.name = name;
    }

    name: PerspectiveCameraIR['name'] = 'c_any';
    type: PerspectiveCameraIR['type'] = 'camera';
    kind: PerspectiveCameraIR['kind'] = 'perspective';

    fov = 45;
    aspect = 16 / 9;

    near = 0.1;
    far = 10000;

    zoom = 1;
    filmGauge = 35;
    filmOffset = 0;
}


export function regPerspectiveCamera<T extends string>(
    name: T,
    config?: (t: Omit<PerspectiveCameraIR, 'name' | 'kind'>) => void
): CameraHandle<T> {

    if (name.length === 0) throw new Error('Camera name cannot be empty');

    const Ex_name: CameraHandle<T>['name'] = `c_${name}`;

    const item = new defaultCamera(Ex_name);

    if (config) config(item);

    CameraRegistry.reg(Ex_name, item);

    return { type: 'camera', kind: item.kind, name: Ex_name };
}
