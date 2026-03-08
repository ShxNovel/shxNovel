import { ExtAnimateOp } from "@shxnovel/schema";

export interface AnimateUnit {
    type: 'animate';
    content: ExtAnimateOp[];
    meta?: Record<string, any>;
}