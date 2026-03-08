import * as fs from 'fs';
import * as path from 'path';
import { fileImport } from '../tools';

export interface ConfigResult {
    config: Record<string, any>;
    files: string[];
}

export async function getConfig(
    dirPath: string,
    configFileName: string = 'config'
): Promise<ConfigResult> {
    const config: Record<string, any> = {};
    const files: string[] = [];

    if (!fs.existsSync(dirPath)) {
        throw new Error(`Directory not found: ${dirPath}`);
    }

    async function traverseDirectory(currentPath: string, relativePath: string = '') {
        const dirFiles = fs.readdirSync(currentPath);

        for (const file of dirFiles) {
            const fullPath = path.join(currentPath, file);
            const fileName = file.replace(/\.[^.]+$/, '');
            const relativeFilePath = relativePath ? path.join(relativePath, file) : file;

            if (fileName === configFileName) {
                try {
                    const result = (await fileImport(fullPath)) as { default: any };
                    Object.assign(config, result.default || result);
                } catch (error) {
                    throw new Error(`Failed to load config from ${fullPath}: ${error}`);
                }
                continue;
            }

            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                await traverseDirectory(fullPath, relativeFilePath);
            } else if (file.endsWith('.ts') || file.endsWith('.js')) {
                files.push(relativeFilePath);
            }
        }
    }

    await traverseDirectory(dirPath);

    return { config, files };
}
