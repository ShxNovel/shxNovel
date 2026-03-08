import * as fs from 'fs';
import * as path from 'path';
import format from 'json-stringify-pretty-compact';
import { fileImport, libImport } from '../tools';
import { logger } from '../utils/logger';
import { progress } from '../utils/progress';
import { FileNotFoundError, ConfigError } from '../utils/errors';
import { ensureDirectory } from '../utils/config';
import { getConfig as loadConfig } from '../utils/shared';

const {
    GlobalStory,
    rewriteParser,
    useChapter,
    character,
    visual,
    timelabel,
    system,
    branch,
    // choice,
    jump,
    flag,
    directive,
    // rt
    camera,
    scene,
} =
    // sync with user runtime
    (await libImport('@shxnovel/rewrite')).default as typeof import('@shxnovel/rewrite');

type CacheValueWithUndefined = ReturnType<(typeof rewriteParser)['cache']['get']>;
type IRNodes = NonNullable<CacheValueWithUndefined>;

function inject() {
    (global as any).useChapter = useChapter;
    (global as any).character = character;
    (global as any).visual = visual;
    (global as any).timelabel = timelabel;
    (global as any).system = system;
    (global as any).branch = branch;
    // (global as any).choice = choice;
    (global as any).jump = jump;
    (global as any).flag = flag;
    (global as any).directive = directive;
    // rt ??
    (global as any).camera = camera;
    (global as any).scene = scene;
}

export async function storyCLI(baseDir: string = '', outputDir?: string, watch: boolean = false) {
    const spinner = progress.start('Processing stories...');

    try {
        inject();

        const inputPath = path.resolve(process.cwd(), baseDir, './story');
        const outputPath = outputDir
            ? path.join(outputDir, './storyIR')
            : path.resolve(process.cwd(), baseDir, './.vn', './storyIR');

        // set env
        // remove when vite production
        process.env.RewriteInputPath = inputPath;

        logger.debug(`Input path: ${inputPath}`);
        logger.debug(`Output path: ${outputPath}`);
        logger.debug(`Watch mode: ${watch}`);

        // Validate input path
        if (!fs.existsSync(inputPath)) {
            throw new FileNotFoundError(inputPath);
        }

        spinner.text = 'Loading configuration...';
        const { config, files: storyFiles } = await loadConfig(inputPath);

        logger.debug(`Found ${storyFiles.length} story files`);

        // Validate config
        if (!config.entry) {
            throw new ConfigError('Entry chapter not specified in config');
        }

        // Load story files
        spinner.text = 'Loading story files...';
        for (const file of storyFiles) {
            const filePath = path.join(inputPath, file);
            await fileImport(filePath);
        }

        // Solve chapters
        spinner.text = 'Processing chapters...';
        GlobalStory.chapters.forEach((chapter, name) => {
            rewriteParser.solveOne(name, chapter);
        });

        // Validate entry chapter
        if (!rewriteParser.cache.has(config.entry)) {
            throw new ConfigError(`Entry chapter not found: ${config.entry}`);
        }

        // Ensure output directory exists
        ensureDirectory(outputPath);

        // Write IR files
        spinner.text = 'Writing output files...';
        rewriteParser.cache.forEach((irs, name) => {
            // collect flags
            collectFlags(name, irs);

            // Write IR file
            const filePath = path.join(outputPath, encodeURIComponent(`${name}.ir.json`));
            const json = format(irs, {
                indent: 2,
                maxLength: 120,
            });
            fs.writeFileSync(filePath, json);
        });

        // Write config
        const configPath = path.join(outputPath, 'config.json');
        const configJson = format(config, {
            indent: 2,
            maxLength: 120,
        });
        fs.writeFileSync(configPath, configJson);

        // Write flags
        const flagPath = path.join(outputPath, 'flags.json');
        const flagJson = format(FlagCollection, {
            indent: 2,
            maxLength: 120,
        });
        fs.writeFileSync(flagPath, flagJson);

        progress.succeed(spinner, 'Stories processed successfully');
        logger.info(`Output written to: ${outputPath}`);

        // Watch mode (placeholder - implement file watching)
        if (watch) {
            logger.warn('Watch mode not yet implemented');
        }
    } catch (error) {
        progress.fail(spinner, 'Failed to process stories');
        throw error;
    }
}

const FlagCollection: Record<string, any> = {};

function collectFlags(name: string, irs: IRNodes) {
    let len = irs.length;
    for (let i = 0; i < len; i++) {
        const ir = irs[i];

        if (ir.type === 'flag') {
            FlagCollection[ir.name] = {
                name,
                pc: i,
            };
        }
    }
}
