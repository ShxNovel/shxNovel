export const InGameData = {};

export function useInGameData<T extends Record<string, any>>(args: T) {
    Object.assign(InGameData, args);
}
