/**
 * 存储驱动接口
 * 由外部（如 shxnovel）实现并注入，以支持不同的运行环境（Web LocalStorage / Tauri FS）
 */
export interface StorageDriver {
    save(id: string, data: any): Promise<void>;
    load(id: string): Promise<any>;
    remove(id: string): Promise<void>;
}

/**
 * 游戏存档管理器
 * 提供统一的存档/读档入口，具体实现委托给注入的驱动
 */
export class GameStorage {
    private static driver: StorageDriver | null = null;

    /**
     * 初始化驱动（应在游戏启动时调用）
     */
    static setDriver(driver: StorageDriver) {
        this.driver = driver;
    }

    /**
     * 保存数据
     * @param saveId 存档 ID
     * @param data 快照数据
     */
    static async save(saveId: string, data: any): Promise<void> {
        if (!this.driver) {
            throw new Error('[GameStorage] Driver not set. Please call setDriver() first.');
        }
        return await this.driver.save(saveId, data);
    }

    /**
     * 加载数据
     * @param saveId 存档 ID
     */
    static async load(saveId: string): Promise<any> {
        if (!this.driver) {
            throw new Error('[GameStorage] Driver not set. Please call setDriver() first.');
        }
        return await this.driver.load(saveId);
    }

    /**
     * 删除数据
     * @param saveId 存档 ID
     */
    static async remove(saveId: string): Promise<void> {
        if (!this.driver) {
            throw new Error('[GameStorage] Driver not set. Please call setDriver() first.');
        }
        return await this.driver.remove(saveId);
    }
}
