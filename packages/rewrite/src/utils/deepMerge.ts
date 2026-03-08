/**
 * Simple deep merge for objects
 */
export function deepMerge<T extends object>(target: T, source: object): T {
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const sourceValue = (source as any)[key];
            const targetValue = (target as any)[key];

            if (
                sourceValue &&
                typeof sourceValue === 'object' &&
                !Array.isArray(sourceValue) &&
                targetValue &&
                typeof targetValue === 'object' &&
                !Array.isArray(targetValue)
            ) {
                deepMerge(targetValue, sourceValue);
            } else {
                (target as any)[key] = sourceValue;
            }
        }
    }
    return target;
}
