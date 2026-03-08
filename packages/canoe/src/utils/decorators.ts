// import { renderScheduler } from '../core/render-scheduler';

/**
 * A decorator that proxies a property to a nested path and triggers render on change.
 * @param path - The path to the nested property (e.g., 'position.x')
 */
export function proxyProp(path: string) {
    return function (target: any, key: string) {
        const parts = path.split('.');
        const lastPart = parts.pop()!;

        Object.defineProperty(target, key, {
            get() {
                let obj = this;
                for (const part of parts) {
                    obj = obj[part];
                }
                return obj[lastPart];
            },
            set(v: any) {
                let obj = this;
                for (const part of parts) {
                    obj = obj[part];
                }
                obj[lastPart] = v;
            },
            enumerable: true,
            configurable: true,
        });
    };
}
