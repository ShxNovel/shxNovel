import { ToDiscriminatedUnion } from "../../utils/ToDiscriminatedUnion";

export interface TextIR {
    name: string | null;
    quote: boolean;
    content: TextOp[];
}

export type TextOp = string | ExtTextOp;

export type ExtTextOp = ToDiscriminatedUnion<ExtText>;

export interface ExtText {

    "wait": { ms: number }

    "fast": { text: string }

    "speed": { speed: number }

}