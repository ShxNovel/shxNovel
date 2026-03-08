import { AnimateIR } from "./animate";
import { SystemIR } from "./system";
import { TextIR } from "./text";

export interface TickIR {
    type: 'tick';

    text: TextIR;

    animate: AnimateIR;

    system: SystemIR;

    meta?: Record<string, any>;
}