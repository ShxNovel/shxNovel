import { Animate } from '@shxnovel/schema';

export interface OneScene<T> {
    type: 'scene';
    name: T;
}

export function scene<T extends Animate.SceneKey>(name: T) {
    return {
        type: 'scene',
        name,
    } satisfies OneScene<T>;
}
