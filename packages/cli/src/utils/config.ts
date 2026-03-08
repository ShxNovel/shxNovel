import * as fs from 'fs';
import * as path from 'path';

export interface CLIConfig {
    verbose?: boolean;
    dryRun?: boolean;
    watch?: boolean;
    output?: string;
}

export interface ProjectConfig {
    entry?: string;
    [key: string]: any;
}

export function loadConfig(configPath: string): ProjectConfig | null {
    if (!fs.existsSync(configPath)) {
        return null;
    }

    try {
        // Handle both JSON and JS/TS config files
        if (configPath.endsWith('.json')) {
            const content = fs.readFileSync(configPath, 'utf-8');
            return JSON.parse(content);
        } else {
            // For JS/TS configs, you'd need dynamic import
            // This is a simplified version
            return null;
        }
    } catch (error) {
        throw new Error(`Failed to load config from ${configPath}: ${error}`);
    }
}

export function validateProjectDirectory(dir: string): void {
    const fullPath = path.resolve(process.cwd(), dir);

    if (!fs.existsSync(fullPath)) {
        throw new Error(`Directory not found: ${fullPath}`);
    }

    if (!fs.statSync(fullPath).isDirectory()) {
        throw new Error(`Not a directory: ${fullPath}`);
    }
}

export function ensureDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
