import { RenderTargetIR } from '@shxnovel/schema';

export class RTRegistry {
    static pool = new Map<string, RenderTargetIR>();

    static reg(name: string, RT: RenderTargetIR) {
        if (name.length === 0) {
            throw new Error('RenderTarget name cannot be empty');
        }
        if (this.pool.has(name)) {
            throw new Error(`RenderTarget ${name} already registered`);
        }
        this.pool.set(name, RT);
    }

    static finish() {
        return this.pool;
    }
}
