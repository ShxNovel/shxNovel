import { GameStorage } from "../game";

export class InGameData {
    static data: Record<string, any> = {}

    static visit() {
        return this.data;
    }

    static getState() {
        return structuredClone(this.data);
    }

    static recover(data: Record<string, any>) {
        this.data = structuredClone(data);
    }
}

export class GlobalData {
    static data: Record<string, any> = {}

    static async initLoad() {
        await GameStorage.load('GlobalData');
    }

    static async save() {
        await GameStorage.save('GlobalData', this.data);
    }

    static visit() {
        return this.data;
    }

    static getState() {
        return structuredClone(this.data);
    }

    static recover(data: Record<string, any>) {
        this.data = structuredClone(data);
    }
}