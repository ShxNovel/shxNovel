import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import chalk from 'chalk';
import { logger } from '../utils/logger';
import { progress } from '../utils/progress';
import { ensureDirectory } from '../utils/config';
import { TEMPLATES } from './templates';

interface CreateOptions {
    name?: string;
    force?: boolean;
}

interface CreateAnswers {
    projectName: string;
    directory: string;
}

function createInterface(): readline.Interface {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
}

function question(rl: readline.Interface, query: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function askQuestions(rl: readline.Interface, defaultDir: string, defaultName?: string): Promise<CreateAnswers> {
    const answers: CreateAnswers = {
        projectName: '',
        directory: '',
    };

    // Ask for project name (required)
    while (!answers.projectName) {
        const namePrompt = defaultName
            ? `Project name: ${chalk.cyan(defaultName)} (press Enter to use default)\n  > `
            : 'Project name: ';
        answers.projectName = await question(rl, namePrompt);

        if (!answers.projectName && defaultName) {
            answers.projectName = defaultName;
        }

        if (!answers.projectName) {
            logger.error('Project name is required');
        }
    }

    // Ask for directory (required, with default)
    while (!answers.directory) {
        const dirPrompt = `Directory: ${chalk.cyan(defaultDir)} (press Enter to use default)\n  > `;
        answers.directory = await question(rl, dirPrompt);

        if (!answers.directory) {
            answers.directory = defaultDir;
        }

        if (!answers.directory) {
            logger.error('Directory is required');
        }
    }

    return answers;
}



function writeFile(filePath: string, content: string) {
    const dir = path.dirname(filePath);
    ensureDirectory(dir);
    fs.writeFileSync(filePath, content, 'utf-8');
}

export async function createCLI(targetDir: string = '', options: CreateOptions = {}) {
    const rl = createInterface();
    const defaultDirectory = targetDir || './projects';
    const defaultName = options.name || path.basename(path.resolve(process.cwd(), defaultDirectory));

    let answers: CreateAnswers;

    try {
        logger.info('Welcome to ShxNovel project creator!');
        logger.info('');

        // Interactive mode: ask questions
        answers = await askQuestions(rl, defaultDirectory, defaultName);
        rl.close();
    } catch (error) {
        rl.close();
        throw error;
    }

    const spinner = progress.start('Creating ShxNovel project...');

    try {
        const projectName = answers.projectName;
        const projectPath = path.resolve(process.cwd(), answers.directory, projectName);

        logger.debug(`Project path: ${projectPath}`);
        logger.debug(`Project name: ${projectName}`);

        // Check if directory exists
        if (fs.existsSync(projectPath)) {
            if (options.force) {
                logger.warn(`Directory ${projectPath} already exists, force mode enabled`);
            } else {
                progress.fail(spinner, 'Project creation cancelled');
                rl.close();
                throw new Error(`Directory ${projectPath} already exists. Use --force to overwrite.`);
            }
        }

        // Create directories
        spinner.text = 'Creating directory structure...';
        const directories = [
            path.join(projectPath, 'assets', 'audio'),
            path.join(projectPath, 'assets', 'texture'),
            path.join(projectPath, 'story'),
            path.join(projectPath, 'world'),
            path.join(projectPath, 'plugins'),
            path.join(projectPath, '.vn'),
            path.join(projectPath, '.vn', 'storyIR'),
            path.join(projectPath, '.vn', 'worldIR'),
        ];

        for (const dir of directories) {
            ensureDirectory(dir);
        }

        // Create files
        spinner.text = 'Creating project files...';

        // Root files
        writeFile(path.join(projectPath, 'package.json'), TEMPLATES.packageJson(projectName));
        writeFile(path.join(projectPath, 'tsconfig.json'), TEMPLATES.tsconfigJson);
        writeFile(path.join(projectPath, '.prettierrc'), TEMPLATES.prettierrc);

        // .vn files
        writeFile(path.join(projectPath, '.vn', 'manifest.json'), TEMPLATES.vnManifest);

        // Story files
        writeFile(path.join(projectPath, 'story', 'config.ts'), TEMPLATES.storyConfig);
        writeFile(path.join(projectPath, 'story', '1.1.1.ts'), TEMPLATES.storyExample);

        // World files
        writeFile(path.join(projectPath, 'world', 'pipeline.ts'), TEMPLATES.worldPipeline);
        writeFile(path.join(projectPath, 'world', 'data.example.ts'), TEMPLATES.worldDataExample);
        writeFile(path.join(projectPath, 'world', 'visual.example.ts'), TEMPLATES.worldVisualExample);
        writeFile(path.join(projectPath, 'world', 'shader.example.ts'), TEMPLATES.worldShaderExample);

        progress.succeed(spinner, `ShxNovel project created successfully at ${projectPath}`);
        logger.info('');
        logger.info('Next steps:');
        logger.info(`  cd ${answers.directory}`);
        logger.info('  pnpm init');
        logger.info('  pnpm build');
        logger.info('');
        logger.info('To start development, run:');
        logger.info('  pnpm use');
    } catch (error) {
        progress.fail(spinner, 'Failed to create project');
        throw error;
    }
}
