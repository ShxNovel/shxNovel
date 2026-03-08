export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

type ChalkInput = string | undefined;

const color = {
    // 灰色：使用较深的灰色，保证在白色背景上清晰，但又比黑色浅
    gray: 'color: #6b7280',
    // 蓝色：使用 VS Code 风格的蓝色，比默认 blue 更柔和且清晰
    blue: 'color: #007acc',
    // 黄色：千万不要用 pure yellow。这里使用了"深金色/琥珀色"，在白色背景极易阅读
    yellow: 'color: #d97706',
    // 高亮黄：比普通黄稍微鲜艳一点，倾向于橙色，避免刺眼
    yellowBright: 'color: #f59e0b',
    // 红色：标准的错误红，降低了饱和度，不那么刺眼
    red: 'color: #dc2626',
    // 高亮红：倾向于绯红色，用于强调
    redBright: 'color: #ef4444',
    // 绿色：使用森林绿，默认的 green (#00ff00) 在白底上是看不清的
    green: 'color: #16a34a',
    // 高亮绿：稍微鲜艳一点的翠绿
    greenBright: 'color: #22c55e',
    // 额外补充：紫色 (调试常用于区分不同模块)
    purple: 'color: #9333ea',
    // 额外补充：青色
    cyan: 'color: #0891b2',
};

const chalk = {
    gray: (message: ChalkInput) => [`%c${message}`, color.gray],
    blue: (message: ChalkInput) => [`%c${message}`, color.blue],
    yellow: (message: ChalkInput) => [`%c${message}`, color.yellow],
    yellowBright: (message: ChalkInput) => [`%c${message}`, color.yellowBright],
    red: (message: ChalkInput) => [`%c${message}`, color.red],
    redBright: (message: ChalkInput) => [`%c${message}`, color.redBright],
    green: (message: ChalkInput) => [`%c${message}`, color.green],
    greenBright: (message: ChalkInput) => [`%c${message}`, color.greenBright],
    purple: (message: ChalkInput) => [`%c${message}`, color.purple],
    cyan: (message: ChalkInput) => [`%c${message}`, color.cyan],
};

class Logger {
    private level: LogLevel = 'debug';
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
            console.log(...chalk.gray(`[DEBUG] ${message}`), ...args);
        }
    }

    info(message: string, ...args: any[]): void {
        if (this.shouldLog('info')) {
            console.log(...chalk.blue(`[INFO] ${message}`), ...args);
        }
    }

    warn(message: string, ...args: any[]): void {
        if (this.shouldLog('warn')) {
            console.warn(...chalk.yellowBright(`[WARN] ${message}`), ...args);
        }
    }

    error(message: string, error?: Error | unknown, ...args: any[]): void {
        if (this.shouldLog('error')) {
            console.error(...chalk.redBright(`[ERROR] ${message}`), ...args);
            if (error instanceof Error) {
                console.error(...chalk.red(`  ${error.message}`));
                if (this.verbose) {
                    console.error(...chalk.gray(error.stack));
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
