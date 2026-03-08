import { logger } from '../logger';
import { loadJson } from '../utils/loadFile';

type Flags = {
    [some: string]: {
        name: string;
        pc: number;
    };
};

/**
 * Flag management utility class for handling game flags
 */
export class FlagManager {
    static flags: Promise<Flags> | undefined = undefined;

    static base = '/game/storyIR';

    /**
     *
     */
    static ensure() {
        if (this.flags) {
            logger.debug('Hit cache for flags');
            return;
        }

        const src = `${this.base}/flags.json`;

        this.flags = loadJson(src).catch((err) => {
            this.flags = undefined;

            logger.error(`Failed to load ${src}:`, err);

            throw err;
        });

        logger.debug(`loading cache for ${src}`);
    }

    /**
     *
     */
    static async getFlags() {
        this.ensure();

        return await this.flags;
    }

    /**
     *
     */
    static async getFlag(name: string) {
        this.ensure();

        const flags = await this.getFlags();

        if (!flags) {
            logger.error(`Failed to get flags`);
            throw new Error(`Failed to get flags`);
        }

        return flags[name];
    }
}
