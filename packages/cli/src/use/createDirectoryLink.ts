import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

/**
 * 创建跨平台的目录链接
 * @param sourcePath 源目录路径 (要被链接的目录，即 b)
 * @param targetPath 目标路径 (链接将创建的位置，即 a)
 */
export function createDirectoryLink(sourcePath: string, targetPath: string): void {
    // 解析为绝对路径
    const resolvedSource = path.resolve(sourcePath);
    const resolvedTarget = path.resolve(targetPath);

    // 检查源目录是否存在，不存在则自动创建
    if (!fs.existsSync(resolvedSource)) {
        fs.mkdirSync(resolvedSource, { recursive: true });
        logger.success(`源目录已自动创建: ${resolvedSource}`);
    }

    // 如果目标已存在，先删除
    if (fs.existsSync(resolvedTarget)) {
        try {
            fs.rmSync(resolvedTarget, { recursive: true, force: true });
        } catch (error) {
            throw new Error(`无法删除已存在的目标路径: ${resolvedTarget}`);
        }
    }

    // 根据平台选择不同的链接方式
    if (process.platform === 'win32') {
        // Windows 使用 junction
        try {
            fs.symlinkSync(resolvedSource, resolvedTarget, 'junction');
            logger.success(`Windows junction 创建成功: ${resolvedTarget} -> ${resolvedSource}`);
        } catch (error) {
            throw new Error(`Windows junction 创建失败: ${error}`);
        }
    } else {
        // Linux/macOS 使用符号链接
        try {
            fs.symlinkSync(resolvedSource, resolvedTarget);
            logger.success(`符号链接创建成功: ${resolvedTarget} -> ${resolvedSource}`);
        } catch (error) {
            // 在某些系统上可能需要管理员权限
            throw new Error(`符号链接创建失败 (可能需要管理员权限): ${error}`);
        }
    }
}


