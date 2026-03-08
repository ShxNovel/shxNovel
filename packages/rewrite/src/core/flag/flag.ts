import { FlagIR } from '@shxnovel/schema';

import { GlobalStory } from '../rewrite-ctx';

import { deepMerge } from '../../utils/deepMerge';
import { getPathDiff } from '../../utils/getPathDiff';
import { getStack } from '../../utils/getStack';

export type FlagUnit = FlagIR;

export interface FlagImpl {
    new(): never;
    /**
     * Set a flag with the given name
     * @param name flag name
     */
    (...args: Parameters<typeof _flag>): ReturnType<typeof _flag>;
}

function _flag(name: string, content?: () => void) {
    if (name === '') {
        throw new Error('Flag name cannot be empty');
    }

    let debug: null | string = null;
    if (process.env.RewriteInputPath) debug = getPathDiff(process.env.RewriteInputPath, getStack(flag));

    const item: FlagUnit = { type: 'flag', name };

    if (process.env.RewriteInputPath) deepMerge(item, { meta: { debug } });

    GlobalStory.push(item);

    if (!content) return;

    // todo
    content();
}

export const flag = _flag as unknown as FlagImpl;