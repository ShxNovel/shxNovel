import chalk from 'chalk';

// 强制启用颜色支持
chalk.level = 1;

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

class Logger {
    private level: LogLevel = 'info';
    private verbose = false;

    setLevel(level: LogLevel): void {
        this.level = level;
    }

    setVerbose(verbose: boolean): void {
        this.verbose = verbose;
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'success'];
        return levels.indexOf(level) >= levels.indexOf(this.level) || this.verbose;
    }

    debug(message: string, ...args: any[]): void {
        if (this.shouldLog('debug')) {
            console.log(chalk.gray(`[DEBUG] ${message}`), ...args);
        }
    }

    info(message: string, ...args: any[]): void {
        if (this.shouldLog('info')) {
            console.log(chalk.blue(`[INFO] ${message}`), ...args);
        }
    }

    warn(message: string, ...args: any[]): void {
        if (this.shouldLog('warn')) {
            console.warn(chalk.yellowBright(`[WARN] ${message}`), ...args);
        }
    }

    error(message: string, error?: Error | unknown, ...args: any[]): void {
        if (this.shouldLog('error')) {
            console.error(chalk.redBright(`[ERROR] ✗ ${message}`), ...args);
            if (error instanceof Error) {
                console.error(chalk.red(`  ${error.message}`));
                if (this.verbose) {
                    console.error(chalk.gray(error.stack));
                }
            }
        }
    }

    success(message: string, ...args: any[]): void {
        if (this.shouldLog('success')) {
            console.log(chalk.greenBright(`[SUCCESS] ${message}`), ...args);
        }
    }
}

export const logger = new Logger();
