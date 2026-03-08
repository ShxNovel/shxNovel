import { BranchIR, FlagIR, JumpIR } from "./flow";
import { TickIR } from "./tick";

export type StoryIR =
    | TickIR
    | BranchIR | FlagIR | JumpIR;