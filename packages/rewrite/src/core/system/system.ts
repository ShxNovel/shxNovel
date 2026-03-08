import { Animate, ExtSystemOp } from "@shxnovel/schema";
import { GlobalStory } from "../rewrite-ctx";

export interface SystemUnit {
    type: 'system';
    content: ExtSystemOp[];
    meta?: Record<string, any>;
}

export interface SysInterface {
    usePipeline(pipeline: Animate.PipelineKey): this;
}

export class SysImpl implements SysInterface {
    usePipeline(pipeline: Animate.PipelineKey) {
        GlobalStory.push({ type: 'system', content: [{ kind: 'usePipeline', name: pipeline }] });
        return this;
    }
}

export function system() {
    return new SysImpl() as SysInterface;
}
