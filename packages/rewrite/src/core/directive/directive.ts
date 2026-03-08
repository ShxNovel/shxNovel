import { ToDiscriminatedUnion } from '@shxnovel/schema';
import { GlobalStory } from '../rewrite-ctx';

export interface DirectiveName {
    'scene-boundary': any;
    'scene-bind-next': any;
}

export type Directive = {
    type: 'directive',
    meta?: Record<string, any>;
} & ToDiscriminatedUnion<DirectiveOp>;

export interface DirectiveOp {
    "scene-boundary": {};
    "scene-bind-next": {};
}

/**
 * Directive methods
 */
export class directive {

    constructor() {
        throw new Error('Directive is a static class, cannot be instantiated');
    }

    /**
     * Define a scene boundary.
     */
    static get SceneBoundary() {
        GlobalStory.push({
            type: 'directive',
            kind: 'scene-boundary',
        } satisfies Directive);
        return () => { };
    }

    /**
     * Tell the compiler that after this scene ends,\
     * it should automatically jump to the next scene.
     */
    static get SceneBindNext() {
        GlobalStory.push({
            type: 'directive',
            kind: 'scene-bind-next',
        } satisfies Directive);
        return () => { };
    }
}