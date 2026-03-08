import { AnimateUnit } from "./animate";
import { BranchUnit } from "./branch";
import { Directive } from "./directive";
import { FlagUnit } from "./flag";
import { JumpUnit } from "./jump";
import { GlobalStory } from "./rewrite-ctx";
import { SystemUnit } from "./system";
import { TextUnit } from "./text";

export type ChapterUnit =
    /* Tick */
    | TextUnit | AnimateUnit | SystemUnit
    /* Flow */
    | FlagUnit | JumpUnit | BranchUnit
    /* Directive */
    | Directive;

export function useChapter(name: string) {

    const cache = GlobalStory.newChapter(name);

    const ChapterImpl = {
        dump() {
            return { name, cache };
        }
    }

    return ChapterImpl;
}