import * as fs from 'fs';
import * as path from 'path';
import format from 'json-stringify-pretty-compact';
import { fileImport, libImport } from '../tools';
import { logger } from '../utils/logger';
import { progress } from '../utils/progress';
import { FileNotFoundError } from '../utils/errors';
import { ensureDirectory } from '../utils/config';
import { getConfig as loadConfig } from '../utils/shared';
import { solveDeclare } from './solveAnimate';
import { solveList } from './solveList';

const { registry } =
    // sync with user runtime
    (await libImport('@shxnovel/world')).default as typeof import('@shxnovel/world');

function inject() {
    (global as any).regCamera = registry.regCamera;
    (global as any).regRT = registry.regRT;
    (global as any).regScene = registry.regScene;
    (global as any).regTexture = registry.regTexture;
    (global as any).regVisual = registry.regVisual;
    (global as any).regPipeline = registry.regPipeline;
    (global as any).regShader = registry.regShader;

    (global as any).useGlobalData = registry.useGlobalData;
    (global as any).useInGameData = registry.useInGameData;
}

export async function worldCLI(baseDir: string = '', outputDir?: string) {
    const spinner = progress.start('Processing world...');

    try {
        inject();

        const inputPath = path.resolve(process.cwd(), baseDir, './world');
        const dtsPath = outputDir || path.resolve(process.cwd(), baseDir, './.vn');
        const worldIRPath = path.join(dtsPath, './worldIR');

        logger.debug(`Input path: ${inputPath}`);
        logger.debug(`Output path: ${dtsPath}`);
        logger.debug(`World IR path: ${worldIRPath}`);

        // Validate input path
        if (!fs.existsSync(inputPath)) {
            throw new FileNotFoundError(inputPath);
        }

        // Load world files
        spinner.text = 'Loading world files...';
        const { files: worldFiles } = await loadConfig(inputPath);

        logger.debug(`Found ${worldFiles.length} world files`);

        for (const file of worldFiles) {
            const filePath = path.join(inputPath, file);
            await fileImport(filePath);
        }

        // Part 1: Generate type declarations
        spinner.text = 'Generating type declarations...';
        const declareOutput = solveDeclare();

        ensureDirectory(dtsPath);
        fs.writeFileSync(path.join(dtsPath, './world.d.ts'), declareOutput);

        // Part 2: Create world IR
        spinner.text = 'Processing world definitions...';
        const resourceList = solveList(registry);

        ensureDirectory(worldIRPath);
        const worldIR = createWorldIR(resourceList, worldIRPath);

        // Part 3: Create manifest
        spinner.text = 'Creating manifest...';
        const manifest = createManifest(worldIR);
        const manifestJson = format(manifest, {
            indent: 2,
            maxLength: 120,
        });
        fs.writeFileSync(path.join(dtsPath, './manifest.json'), manifestJson);

        progress.succeed(spinner, 'World processed successfully');
        logger.info(`Output written to: ${dtsPath}`);
    } catch (error) {
        progress.fail(spinner, 'Failed to process world');
        throw error;
    }
}

function createWorldIR(some: ReturnType<typeof solveList>, worldIRPath: string) {
    const result = {} as Record<string, any>;

    Object.entries(some.texture).forEach(([name, item]) => {
        const outPath = path.join(worldIRPath, encodeURIComponent(`${name}.ir.json`));
        const json = format(item, {
            indent: 2,
            maxLength: 120,
        });
        fs.writeFileSync(outPath, json);
        result[name] = { type: 'texture', path: path.join('worldIR', `${name}.ir.json`).replace(/\\/g, '/') };
    });

    Object.entries(some.rt).forEach(([name, item]) => {
        const outPath = path.join(worldIRPath, encodeURIComponent(`${name}.ir.json`));
        const json = format(item, {
            indent: 2,
            maxLength: 120,
        });
        fs.writeFileSync(outPath, json);
        result[name] = { type: 'rt', path: path.join('worldIR', `${name}.ir.json`).replace(/\\/g, '/') };
    });

    Object.entries(some.camera).forEach(([name, item]) => {
        const outPath = path.join(worldIRPath, encodeURIComponent(`${name}.ir.json`));
        const json = format(item, {
            indent: 2,
            maxLength: 120,
        });
        fs.writeFileSync(outPath, json);
        result[name] = { type: 'camera', path: path.join('worldIR', `${name}.ir.json`).replace(/\\/g, '/') };
    });

    Object.entries(some.scene).forEach(([name, item]) => {
        const outPath = path.join(worldIRPath, encodeURIComponent(`${name}.ir.json`));
        const json = format(item, {
            indent: 2,
            maxLength: 120,
        });
        fs.writeFileSync(outPath, json);
        result[name] = { type: 'scene', path: path.join('worldIR', `${name}.ir.json`).replace(/\\/g, '/') };
    });

    Object.entries(some.visual).forEach(([name, item]) => {
        const outPath = path.join(worldIRPath, encodeURIComponent(`${name}.ir.json`));
        const json = format(item, {
            indent: 2,
            maxLength: 120,
        });
        fs.writeFileSync(outPath, json);
        result[name] = { type: 'visual', path: path.join('worldIR', `${name}.ir.json`).replace(/\\/g, '/') };
    });

    Object.entries(some.pipeline).forEach(([name, item]) => {
        const outPath = path.join(worldIRPath, encodeURIComponent(`${name}.ir.json`));
        const json = format(item, {
            indent: 2,
            maxLength: 120,
        });
        fs.writeFileSync(outPath, json);
        result[name] = { type: 'pipeline', path: path.join('worldIR', `${name}.ir.json`).replace(/\\/g, '/') };
    });

    Object.entries(some.shader).forEach(([name, item]) => {
        const outPath = path.join(worldIRPath, encodeURIComponent(`${name}.ir.json`));
        const json = format(item, {
            indent: 2,
            maxLength: 120,
        });
        fs.writeFileSync(outPath, json);
        result[name] = { type: 'shader', path: path.join('worldIR', `${name}.ir.json`).replace(/\\/g, '/') };
    });

    Object.entries(some.data).forEach(([name, item]) => {
        const outPath = path.join(worldIRPath, encodeURIComponent(`data_${name}.ir.json`));
        const json = format(item, {
            indent: 2,
            maxLength: 120,
        });
        fs.writeFileSync(outPath, json);
        result[`data_${name}`] = { type: 'data', path: path.join('worldIR', `data_${name}.ir.json`).replace(/\\/g, '/') };
    });

    return result;
}

function createManifest(resourceList: ReturnType<typeof createWorldIR>) {
    const manifest = {
        meta: { version: '1.0', engine: 'ShxNovel' },
        resourceList,
    };

    return manifest;
}
