import { BranchIR, GameData } from '@shxnovel/schema';

import { getStack } from '../../utils/getStack';
import { deepMerge } from '../../utils/deepMerge';
import { getPathDiff } from '../../utils/getPathDiff';
import { generator } from '../../utils/splitmix32';

import { GlobalStory } from '../rewrite-ctx';

import { flag } from '../flag';
import { jump } from '../jump';
import { flagTable } from '../../parser';


type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type BranchUnit = BranchIR;

export interface BranchImpl {
    new(): never;

    /**
     * Create a branch
     * @param args Branching conditions and target function configuration
     *
     * @example
     * ```ts
     * branch({
     *   Condition() {
     *      if (this.a > 10) return "success";
     *      if (this.b > 10) return "error";
     *      return "idle";
     *   },
     *
     *   success: "chapter-2", // jump to chapter-2
     *   error() {             // chapter logic
     *      text `something wrong`
     *   },
     *   // use `likely` to mark likely branch
     *   idle(likely) {},
     * })
     * ```
     */
    (...args: Parameters<typeof _branch>): ReturnType<typeof _branch>;
}

function _branch<K extends string, T extends GameData.Impl>(
    args: {
        Condition: () => K;
    } & Partial<Record<K, string | ((...args: any[]) => void)>> &
        // fix `No Contextual Typing`
        ThisType<DeepReadonly<T>>
) {
    const ConditionStr = args.Condition.toString();

    type Logic = string | ((...args: any[]) => void);

    const LikelyLabelMap = new Map<string, Logic>();
    const NormalLabelMap = new Map<string, Logic>();

    Object.entries(args as Record<string, Logic>).forEach(([key, value]) => {
        if (key === 'Condition') return;

        if (typeof value === 'string') {
            NormalLabelMap.set(key, value);
            return;
        }

        if (value.length) {
            LikelyLabelMap.set(key, value);
        } else {
            NormalLabelMap.set(key, value);
        }
    });

    function getLabel() {
        return generator().toString(36).slice(2);
    }

    const ENDFLAG = getLabel();

    let debug: null | string = null;
    if (process.env.RewriteInputPath) debug = getPathDiff(process.env.RewriteInputPath, getStack(branch));

    const item: BranchUnit = {
        type: 'branch',
        cond: ConditionStr,
        ENDFLAG: ENDFLAG,
        targets: {},
    };

    if (process.env.RewriteInputPath) deepMerge(item, { meta: { debug } });

    GlobalStory.push(item);

    function solve(key: string, value: Logic) {
        if (typeof value === 'string') {
            // if value is a flag, just use it
            item.targets[key] = value;

            // this value should be added to flag table
            flagTable.addShould(value, undefined);

            return;
        }
        const label = getLabel();
        flag(label, value);
        jump(ENDFLAG);
        item.targets[key] = label;
    }

    for (const [key, value] of LikelyLabelMap) {
        solve(key, value);
    }

    for (const [key, value] of NormalLabelMap) {
        solve(key, value);
    }

    flag(ENDFLAG);
}

export const branch = _branch as unknown as BranchImpl;