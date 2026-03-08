export const GlobalData = {};

export function useGlobalData<T extends Record<string, any>>(args: T) {
    Object.assign(GlobalData, args);
}
