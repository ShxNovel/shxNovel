import { AnyAnimateProps } from '@shxnovel/schema'
import { OneScene } from './scene';

export type Vector3 = {
    x?: number;
    y?: number;
    z?: number;
};

export interface EnterBuilder {
    into(stage: OneScene<any>): this;
    timelabel(label: string | number): this;
}

export function enterBuilder(ref: AnyAnimateProps): EnterBuilder {
    return {
        into(stage: OneScene<any>) {
            ref.into = stage.name;
            return this;
        },
        timelabel(label: string | number) {
            ref.timelabel = label;
            return this;
        },
    }
}

export interface LeaveBuilder {
    timelabel(label: string | number): this;
}

export function leaveBuilder(ref: AnyAnimateProps): LeaveBuilder {
    return {
        timelabel(label: string | number) {
            ref.timelabel = label;
            return this;
        },
    }
}

export interface ActBuilder {
    x(x: number): this;
    y(y: number): this;
    z(z: number): this;
    pos(x: number, y: number, z?: number): this;
    scale(s: Vector3): this;
    rot(r: Vector3): this;
    renderOrder(order: number): this;
    timelabel(label: string | number): this;
    duration(duration: number): this;
    ease(easing: string): this;
}

export function actBuilder(ref: AnyAnimateProps): ActBuilder {
    return {
        x(x) {
            if (!ref.position) ref.position = {};
            ref.position.x = x;
            return this;
        },
        y(y) {
            if (!ref.position) ref.position = {};
            ref.position.y = y;
            return this;
        },
        z(z) {
            if (!ref.position) ref.position = {};
            ref.position.z = z;
            return this;
        },
        pos(x, y, z) {
            if (!ref.position) ref.position = {};
            ref.position.x = x;
            ref.position.y = y;
            if (z) ref.position.z = z;
            return this;
        },
        scale(s) {
            ref.scale = structuredClone(s);
            return this;
        },
        rot(r) {
            ref.rotation = structuredClone(r);
            return this;
        },
        renderOrder(order) {
            ref.renderOrder = order;
            return this;
        },
        timelabel(label) {
            ref.timelabel = label;
            return this;
        },
        duration(duration) {
            ref.duration = duration;
            return this;
        },
        ease(easing) {
            ref.easing = easing;
            return this;
        }
    }
}