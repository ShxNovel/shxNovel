export type CameraIR = OrthographicCameraIR | PerspectiveCameraIR;

export interface CameraHandle<T extends string = any> {
    name: `c_${T}`;
    type: 'camera';
    kind: 'orthographic' | 'perspective';
}

export interface OrthographicCameraIR {
    name: `c_${string}`;
    type: 'camera';
    kind: 'orthographic';

    left: number;
    right: number;
    top: number;
    bottom: number;

    near: number;
    far: number;

    zoom: number;
}

export interface PerspectiveCameraIR {
    name: `c_${string}`;
    type: 'camera';
    kind: 'perspective';

    fov: number;
    aspect: number;
    near: number;
    far: number;

    zoom: number;
    filmGauge: number;
    filmOffset: number;
}