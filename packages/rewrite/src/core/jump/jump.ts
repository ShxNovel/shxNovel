import { GlobalStory } from "../rewrite-ctx";

import { deepMerge } from '../../utils/deepMerge';
import { getPathDiff } from '../../utils/getPathDiff';
import { getStack } from '../../utils/getStack';
import { JumpIR } from "@shxnovel/schema";
import { flagTable } from "../../parser";

export type JumpUnit = JumpIR;

export interface JumpImpl {
    new(): never;
    /**
     * Jump to the specified flag
     * @param name flag name
     */
    (...args: Parameters<typeof _jump>): ReturnType<typeof _jump>;
}

function _jump(name: string) {
    if (name === '') {
        throw new Error('Jump target cannot be empty');
    }

    let debug: null | string = null;
    if (process.env.RewriteInputPath) debug = getPathDiff(process.env.RewriteInputPath, getStack(jump));

    const item: JumpUnit = {
        type: 'jump',
        target: `${name}`,
    };

    if (process.env.RewriteInputPath) deepMerge(item, { meta: { debug } });

    GlobalStory.push(item);

    flagTable.addShould(name, undefined);
}

export const jump = _jump as unknown as JumpImpl;