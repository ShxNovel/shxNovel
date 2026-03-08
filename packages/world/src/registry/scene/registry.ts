import { SceneIR } from "@shxnovel/schema";

export class SceneRegistry {
    static pool = new Map<string, SceneIR>();

    static reg(name: string, scene: SceneIR) {
        if (name.length === 0) {
            throw new Error('Scene name cannot be empty');
        }
        if (this.pool.has(name)) {
            throw new Error(`Scene ${name} already registered`);
        }
        this.pool.set(name, scene);
    }

    static finish() {
        return this.pool;
    }
}
