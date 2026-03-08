export class GameStorage {
    // @ts-ignore
    static async save(saveId: string, data: any): Promise<void> {
        throw new Error('GameStorage.save() must be implemented by user');
    }

    // @ts-ignore
    static async load(saveId: string): Promise<any> {
        throw new Error('GameStorage.load() must be implemented by user');
    }
}
