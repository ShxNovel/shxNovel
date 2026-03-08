import { PipelineIR } from '@shxnovel/schema';

export class PipelineRegistry {
    static pool = new Map<string, PipelineIR>();

    static reg(name: string, pipeline: PipelineIR) {
        if (name.length === 0) {
            throw new Error('Pipeline name cannot be empty');
        }
        if (this.pool.has(name)) {
            throw new Error(`Pipeline ${name} already registered`);
        }
        this.pool.set(name, pipeline);
    }

    static finish() {
        return this.pool;
    }
}
