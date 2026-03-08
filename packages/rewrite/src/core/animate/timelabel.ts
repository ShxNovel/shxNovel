import { GlobalStory } from '../rewrite-ctx';
import { AnimateUnit } from './types';

export function timelabel(timelabel: string) {
    const item: AnimateUnit = {
        type: 'animate',
        content: [{ kind: 'timelabel', target: timelabel }],
    };
    GlobalStory.push(item satisfies AnimateUnit);
}
