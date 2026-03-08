import chalk from 'chalk';
import { logger } from './logger';

export class CLIError extends Error {
    constructor(
        message: string,
        public code: string,
        public exitCode: number = 1
    ) {
        super(message);
        this.name = 'CLIError';
    }
}

export class ValidationError extends CLIError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR', 1);
        this.name = 'ValidationError';
    }
}

export class FileNotFoundError extends CLIError {
    constructor(path: string) {
        super(`File not found: ${path}`, 'FILE_NOT_FOUND', 1);
        this.name = 'FileNotFoundError';
    }
}

export class ConfigError extends CLIError {
    constructor(message: string) {
        super(message, 'CONFIG_ERROR', 1);
        this.name = 'ConfigError';
    }
}

export function handleError(error: unknown): never {
    if (error instanceof CLIError) {
        logger.error(chalk.red(`Error (${error.code}): ${error.message}`));
        process.exit(error.exitCode);
    } else if (error instanceof Error) {
        logger.error('Unexpected error:', error, error.stack);
        process.exit(1);
    } else {
        logger.error('Unknown error:', error);
        process.exit(1);
    }
}
