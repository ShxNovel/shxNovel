import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';
import { progress } from '../utils/progress';
import { FileNotFoundError } from '../utils/errors';
import { ensureDirectory } from '../utils/config';
import { generateDeclaration } from './generate-declaration';
import { generateManifest } from './generate-manifest';
import { jsonStringify } from '../utils/json';

export type AssetList = {
    audio: string[];
    texture: string[];
};

function normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
}

// @ts-ignore
function removeExtension(filePath: string): string {
    const lastDotIndex = filePath.lastIndexOf('.');
    return lastDotIndex > 0 ? filePath.slice(0, lastDotIndex) : filePath;
}

function getFilesRecursively(dir: string): string[] {
    const files: string[] = [];

    function traverse(currentDir: string) {
        const entries = fs.readdirSync(currentDir);

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                traverse(fullPath);
            } else {
                const relativePath = path.relative(dir, fullPath);
                files.push(normalizePath(relativePath));
            }
        }
    }

    traverse(dir);
    return files;
}

export async function assetCLI(baseDir: string = '', outputDir?: string) {
    const spinner = progress.start('Processing assets...');

    try {
        const inputPath = path.resolve(process.cwd(), baseDir, './assets');
        const outputPath = outputDir
            ? path.resolve(process.cwd(), outputDir)
            : path.resolve(process.cwd(), baseDir, './.vn');

        logger.debug(`Input path: ${inputPath}`);
        logger.debug(`Output path: ${outputPath}`);

        // Validate input paths
        if (!fs.existsSync(inputPath)) {
            throw new FileNotFoundError(inputPath);
        }

        const audioPath = path.join(inputPath, 'audio');
        const texturePath = path.join(inputPath, 'texture');

        if (!fs.existsSync(audioPath)) {
            throw new FileNotFoundError(audioPath);
        }

        if (!fs.existsSync(texturePath)) {
            throw new FileNotFoundError(texturePath);
        }

        // Read asset files recursively
        spinner.text = 'Reading asset files...';
        const audioResult = getFilesRecursively(audioPath);
        const textureResult = getFilesRecursively(texturePath);

        logger.debug(`Found ${audioResult.length} audio files`);
        logger.debug(`Found ${textureResult.length} texture files`);

        const assetList: AssetList = {
            audio: audioResult,
            texture: textureResult,
        };

        // Ensure output directory exists
        ensureDirectory(outputPath);

        // Generate declaration file
        spinner.text = 'Generating type declarations...';
        const declarationOutput = generateDeclaration(assetList);
        fs.writeFileSync(path.join(outputPath, './assets.d.ts'), declarationOutput);

        // Generate manifest file
        spinner.text = 'Generating asset manifest...';
        const manifestOutput = generateManifest(assetList);
        fs.writeFileSync(path.join(outputPath, './assets.manifest.json'), jsonStringify(manifestOutput));

        progress.succeed(spinner, 'Assets processed successfully');
        logger.info(`Output written to: ${outputPath}`);
    } catch (error) {
        progress.fail(spinner, 'Failed to process assets');
        throw error;
    }
}
