import { Animate, ExtAnimateOp } from '@shxnovel/schema'
import { GlobalStory } from '../../rewrite-ctx'
import { AnimateUnit } from '../types';
import { enterBuilder, leaveBuilder, actBuilder, EnterBuilder, LeaveBuilder, ActBuilder } from './builder';

export interface VisualActBuilder<T extends Animate.VisualKey> extends ActBuilder {
    expr(...names: Animate.VisualExprName<T>[]): this;
    uniforms(uniforms: Record<string, any>): this;
}

class VisualImpl<T extends Animate.VisualKey> {
    readonly type = 'visual';
    constructor(public readonly name: T) { }

    get enter(): EnterBuilder {
        const one = {
            kind: "enter" as const,
            target: this.name,
            args: {}
        } satisfies ExtAnimateOp;

        GlobalStory.push({
            type: "animate",
            content: [one]
        } satisfies AnimateUnit)

        return enterBuilder(one.args);
    }

    get leave(): LeaveBuilder {
        const one = {
            kind: "leave" as const,
            target: this.name,
            args: {}
        } satisfies ExtAnimateOp;

        GlobalStory.push({
            type: "animate",
            content: [one]
        } satisfies AnimateUnit)

        return leaveBuilder(one.args);
    }

    get act(): VisualActBuilder<T> {
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
            expr(...names) {
                if (!ref.expr) ref.expr = [];
                ref.expr.push(...names);
                return this;
            },
            uniforms(uniforms) {
                ref.uniforms = structuredClone(uniforms);
                return this;
            },
        } as VisualActBuilder<T>;

        return builder;
    }
}

export function visual<T extends Animate.VisualKey>(name: T) {
    return new VisualImpl(name) as Omit<VisualImpl<T>, 'type' | 'name'>;
}
