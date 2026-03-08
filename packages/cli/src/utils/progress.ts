import ora, { type Ora } from 'ora';

class ProgressManager {
    private spinners: Map<string, Ora> = new Map();

    start(text: string): Ora {
        const spinner = ora({
            text,
            color: 'blue',
        }).start();
        this.spinners.set(text, spinner);
        return spinner;
    }

    succeed(spinner: Ora, text?: string): void {
        spinner.succeed(text);
        this.spinners.delete(spinner.text);
    }

    fail(spinner: Ora, text?: string): void {
        spinner.fail(text);
        this.spinners.delete(spinner.text);
    }

    warn(spinner: Ora, text?: string): void {
        spinner.warn(text);
        this.spinners.delete(spinner.text);
    }

    info(spinner: Ora, text?: string): void {
        spinner.info(text);
        this.spinners.delete(spinner.text);
    }
}

export const progress = new ProgressManager();
