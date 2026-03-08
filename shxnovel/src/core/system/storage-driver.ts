import { StorageDriver } from '@shxnovel/canoe';
import { isTauri } from '@tauri-apps/api/core';
import { load as loadStore, Store } from '@tauri-apps/plugin-store';

/**
 * 具体的存储驱动实现
 * 处理 Web (LocalStorage) 和 Tauri (Store Plugin v2) 的存储逻辑
 */
export class AppStorageDriver implements StorageDriver {
    private readonly SAVE_PREFIX = 'shxn_save_';
    private _tauriStore: Store | null = null;

    /**
     * 获取或初始化 Tauri Store 实例 (使用新的 load API)
     */
    private async _getStore(): Promise<Store | null> {
        if (!isTauri()) return null;

        if (!this._tauriStore) {
            // @ts-ignore
            this._tauriStore = await loadStore('saves.json', { autoSave: true });
        }
        return this._tauriStore;
    }

    async save(id: string, data: any): Promise<void> {
        const store = await this._getStore();
        const key = `${this.SAVE_PREFIX}${id}`;

        if (store) {
            // Tauri 环境
            await store.set(key, data);
            // 即使开启了 autoSave，在存档这种关键操作后手动 save() 一次也是安全的
            await store.save();
            console.log(`[StorageDriver] Persistent Save: ${key}`);
        } else {
            // Web 环境
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`[StorageDriver] LocalStorage Save: ${key}`);
        }
    }

    async load(id: string): Promise<any> {
        const store = await this._getStore();
        const key = `${this.SAVE_PREFIX}${id}`;

        if (store) {
            // Tauri 环境
            const data = await store.get<any>(key);
            return data || null;
        } else {
            // Web 环境
            const rawData = localStorage.getItem(key);
            if (!rawData) return null;

            try {
                return JSON.parse(rawData);
            } catch (e) {
                console.error(`[StorageDriver] Load failed for ${id}:`, e);
                return null;
            }
        }
    }

    async remove(id: string): Promise<void> {
        const store = await this._getStore();
        const key = `${this.SAVE_PREFIX}${id}`;

        if (store) {
            // Tauri 环境
            await store.delete(key);
            await store.save();
            console.log(`[StorageDriver] Persistent Remove: ${key}`);
        } else {
            // Web 环境
            localStorage.removeItem(key);
            console.log(`[StorageDriver] LocalStorage Remove: ${key}`);
        }
    }
}
