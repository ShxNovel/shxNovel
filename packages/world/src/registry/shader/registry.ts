import { ShaderIR } from '@shxnovel/schema';

export class ShaderRegistry {
    static pool = new Map<string, ShaderIR>();

    static reg(name: string, shader: ShaderIR) {
        if (name.length === 0) {
            throw new Error('Shader name cannot be empty');
        }
        if (this.pool.has(name)) {
            throw new Error(`Shader ${name} already registered`);
        }
        this.pool.set(name, shader);
    }

    static finish() {
        return this.pool;
    }
}
