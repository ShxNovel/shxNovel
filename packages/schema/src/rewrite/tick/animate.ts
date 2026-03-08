import { ToDiscriminatedUnion } from "../../utils";

export type AnimateIR = ExtAnimateOp[];

export type ExtAnimateOp = ToDiscriminatedUnion<ExtAnimate>;

export interface ExtAnimate {
    timelabel: { target: string; args?: AnyAnimateProps; }

    enter: { target: string; args?: AnyAnimateProps; }
    leave: { target: string; args?: AnyAnimateProps; }

    act: { target: string; args?: AnyAnimateProps; }
}

export type AnyAnimateProps =
    & CommonProps & TimeProps
    & VisualProps & CameraProps;

interface CommonProps {
    into?: string;

    position?: { x?: number; y?: number; z?: number; }
    rotation?: { x?: number; y?: number; z?: number; }
    scale?: { x?: number; y?: number; z?: number; }

    renderOrder?: number
    timelabel?: string | number
};

interface TimeProps {
    duration?: number;
    easing?: string;
}

interface VisualProps {
    uniforms?: Record<string, any>
    expr?: string[]
}

interface CameraProps {
    fov?: number;
    zoom?: number
}
