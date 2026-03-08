import { ToDiscriminatedUnion } from "../../utils/ToDiscriminatedUnion";

export type SystemIR = ExtSystemOp[];

export type ExtSystemOp = ToDiscriminatedUnion<ExtSystem>;

export interface ExtSystem {
    "usePipeline": {
        name: string
    };
}