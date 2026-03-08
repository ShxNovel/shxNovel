export type ToDiscriminatedUnion<T> = {
    [K in keyof T]: { kind: K } & T[K]
}[keyof T];