import { StorageDriver } from '@shxnovel/canoe';
import { isTauri } from '@tauri-apps/api/core';

/**
 * 具体的存储驱动实现
 * 处理 Web (LocalStorage) 和 Tauri (TODO: Native FS) 的存储逻辑
 */
export class AppStorageDriver implements StorageDriver {
    private readonly SAVE_PREFIX = 'shxn_save_';

    async save(id: string, data: any): Promise<void> {
        if (isTauri()) {
            // TODO: 使用 Tauri 的 FS 模块将 JSON 写入磁盘，以支持无限量存档
            // 目前先回退到 LocalStorage
            localStorage.setItem(`${this.SAVE_PREFIX}${id}`, JSON.stringify(data));
        } else {
            localStorage.setItem(`${this.SAVE_PREFIX}${id}`, JSON.stringify(data));
        }
    }

    async load(id: string): Promise<any> {
        let rawData: string | null = null;

        if (isTauri()) {
            rawData = localStorage.getItem(`${this.SAVE_PREFIX}${id}`);
        } else {
            rawData = localStorage.getItem(`${this.SAVE_PREFIX}${id}`);
        }

        if (!rawData) return null;

        try {
            return JSON.parse(rawData);
        } catch (e) {
            console.error(`[StorageDriver] Failed to parse save data for ${id}:`, e);
            return null;
        }
    }
}
