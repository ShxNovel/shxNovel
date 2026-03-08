export interface JumpIR {
    type: "jump";

    target: string;

    meta?: Record<string, any>;
}