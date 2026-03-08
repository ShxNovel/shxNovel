import { CameraIR } from '@shxnovel/schema';

export class CameraRegistry {
    static pool = new Map<string, CameraIR>();

    static reg(name: string, camera: CameraIR) {
        if (name.length === 0) {
            throw new Error('Camera name cannot be empty');
        }
        if (this.pool.has(name)) {
            throw new Error(`Camera ${name} already registered`);
        }
        this.pool.set(name, camera);
    }

    static finish() {
        return this.pool;
    }
}
