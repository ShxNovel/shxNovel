import { BootIntent } from '../boot-resolver';

export class GameLauncher {
    static intent: BootIntent | null = null;

    static launch(intent: BootIntent) {
        GameLauncher.intent = intent;
    }

    static consume(): BootIntent {
        if (GameLauncher.intent == null) {
            throw new Error('Launch intent not available');
        }

        const result = GameLauncher.intent;
        GameLauncher.intent = null;

        return result;
    }
}
