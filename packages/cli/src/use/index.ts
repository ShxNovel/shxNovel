// import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';
import { progress } from '../utils/progress';
import { createDirectoryLink } from './createDirectoryLink';

export async function useCLI(from: string = '', to: string = '../../shxnovel/public') {
    const spinner = progress.start('Creating directory links...');

    try {
        logger.debug(`Source: ${from}`);
        logger.debug(`Target: ${to}`);

        function solveVN() {
            const fromPath = path.resolve(process.cwd(), from, './.vn');
            const toPath = path.resolve(process.cwd(), to, './game');

            logger.debug(`Creating link: ${fromPath} -> ${toPath}`);

            try {
                createDirectoryLink(fromPath, toPath);
                logger.success('VN directory link created');
            } catch (error) {
                throw new Error(`Failed to create VN link: ${error}`);
            }
        }

        function solveAssets() {
            const fromPath = path.resolve(process.cwd(), from, './assets');
            const toPath = path.resolve(process.cwd(), to, './assets');

            logger.debug(`Creating link: ${fromPath} -> ${toPath}`);

            try {
                createDirectoryLink(fromPath, toPath);
                logger.success('Assets directory link created');
            } catch (error) {
                throw new Error(`Failed to create assets link: ${error}`);
            }
        }

        solveVN();
        solveAssets();

        progress.succeed(spinner, 'Directory links created successfully');
    } catch (error) {
        progress.fail(spinner, 'Failed to create directory links');
        throw error;
    }
}
