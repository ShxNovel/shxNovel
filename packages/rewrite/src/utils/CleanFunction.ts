/** wtf vscode language service, not good */
export type CleanFunction<T extends (...args: any[]) => any> = T & {
    /** @deprecated */ Symbol: never;
    /** @deprecated */ apply: never;
    /** @deprecated */ arguments: never;
    /** @deprecated */ bind: never;
    /** @deprecated */ call: never;
    /** @deprecated */ caller: never;
    /** @deprecated */ toString: never;
    /** @deprecated */ length: never;
    /** @deprecated */ name: never;
    /** @deprecated */ prototype: never;
    /** @deprecated */ [Symbol.hasInstance]: never;
};
