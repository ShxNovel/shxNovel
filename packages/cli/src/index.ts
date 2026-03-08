#!/usr/bin/env node

export * from './inject.world';
export * from './inject.story';

import { Command } from 'commander';
import { logger } from './utils/logger';
import { handleError } from './utils/errors';
import { assetCLI } from './asset';
import { worldCLI } from './world';
import { useCLI } from './use';
import { storyCLI } from './story';
import { createCLI } from './create';

const program = new Command();

program
    .name('shx-cli')
    .description('ShxNovel CLI tool for building visual novels')
    .version('0.3.0')
    .option('-v, --verbose', 'enable verbose output')
    .option('-d, --dry-run', 'show what would be done without making changes');

// Global error handler
process.on('unhandledRejection', (error) => {
    handleError(error);
});

process.on('uncaughtException', (error) => {
    handleError(error);
});

// Asset command
program
    .command('asset')
    .description('Process and generate asset declarations')
    .argument('[base-dir]', 'base directory path', '')
    .option('-o, --output <path>', 'output directory path')
    .action(async (baseDir, options) => {
        try {
            if (program.opts().verbose) {
                logger.setVerbose(true);
            }

            if (program.opts().dryRun) {
                logger.info('Dry run mode enabled - no files will be modified');
            }

            await assetCLI(baseDir, options.output);
        } catch (error) {
            handleError(error);
        }
    });

// World command
program
    .command('world')
    .description('Process and compile world definitions')
    .argument('[base-dir]', 'base directory path', '')
    .option('-o, --output <path>', 'output directory path')
    .action(async (baseDir, options) => {
        try {
            if (program.opts().verbose) {
                logger.setVerbose(true);
            }

            if (program.opts().dryRun) {
                logger.info('Dry run mode enabled - no files will be modified');
            }

            await worldCLI(baseDir, options.output);
        } catch (error) {
            handleError(error);
        }
    });

// Story command
program
    .command('story')
    .description('Process and compile story scripts')
    .argument('[base-dir]', 'base directory path', '')
    .option('-o, --output <path>', 'output directory path')
    .option('-w, --watch', 'watch for file changes')
    .action(async (baseDir, options) => {
        try {
            if (program.opts().verbose) {
                logger.setVerbose(true);
            }

            if (program.opts().dryRun) {
                logger.info('Dry run mode enabled - no files will be modified');
            }

            await storyCLI(baseDir, options.output, options.watch);
        } catch (error) {
            handleError(error);
        }
    });

// Use command
program
    .command('use')
    .description('Create directory links for development')
    .argument('[from]', 'source directory', '')
    .argument('[to]', 'target directory', '../../shxnovel/public')
    .action(async (from, to) => {
        try {
            if (program.opts().verbose) {
                logger.setVerbose(true);
            }

            if (program.opts().dryRun) {
                logger.info('Dry run mode enabled - no links will be created');
            }

            await useCLI(from, to);
        } catch (error) {
            handleError(error);
        }
    });

// Create command
program
    .command('create')
    .description('Create a new ShxNovel project')
    .argument('[directory]', 'target directory path')
    .option('-n, --name <name>', 'project name', 'my-game')
    .option('-f, --force', 'force create even if directory exists')
    .action(async (directory, options) => {
        try {
            if (program.opts().verbose) {
                logger.setVerbose(true);
            }

            if (program.opts().dryRun) {
                logger.info('Dry run mode enabled - no files will be created');
            }

            await createCLI(directory, {
                name: options.name,
                force: options.force,
            });
        } catch (error) {
            handleError(error);
        }
    });

program.parse(process.argv);
