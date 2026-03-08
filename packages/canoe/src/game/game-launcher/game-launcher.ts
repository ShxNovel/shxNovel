export type BootIntent =
    | { type: 'new' }
    | { type: 'continue' }
    | { type: 'load'; saveId: string }
    | { type: 'debug'; chapterId: string };

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
