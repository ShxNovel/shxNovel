import { Animate, ExtAnimateOp } from '@shxnovel/schema'
import { GlobalStory } from '../../rewrite-ctx';
import { AnimateUnit } from '../types';
import { actBuilder, ActBuilder } from './builder';

export interface CameraActBuilder extends ActBuilder {
    fov(value: number): this;
    zoom(value: number): this;
}

class CameraImpl<T extends Animate.CameraKey> {
    readonly type = 'camera';
    constructor(public readonly name: T) { }

    get act(): CameraActBuilder {
        const one = {
            kind: "act" as const,
            target: this.name,
            args: {}
        } as ExtAnimateOp;

        const ref = one.args!;

        GlobalStory.push({
            type: "animate",
            content: [one]
        } satisfies AnimateUnit)

        const builder = {
            ...actBuilder(ref),
            fov(value) {
                ref.fov = value;
                return this;
            },
            zoom(value) {
                ref.zoom = value;
                return this;
            }
        } as CameraActBuilder;

        return builder;
    }
}

export function camera<T extends Animate.CameraKey>(name: T) {
    return new CameraImpl(name) as Omit<CameraImpl<T>, 'type' | 'name'>;
}
