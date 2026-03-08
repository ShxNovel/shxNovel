import { logger } from '../logger';
import { loadJson } from '../utils/loadFile';

type AssetsManifest = any;
type CommonManifest = any;

export class ManifestManager {
    static assets_manifest: Promise<AssetsManifest> | undefined = undefined;
    static common_manifest: Promise<CommonManifest> | undefined = undefined;

    /**
     *
     */
    static ensure_assets(): void {
        if (this.assets_manifest) {
            logger.debug(`Hit cache for manifest(assets)`);
            return;
        }

        this.assets_manifest = loadJson('/game/assets.manifest.json').catch((err) => {
            this.assets_manifest = undefined;
            logger.error('Failed to load manifest(assets):', err);
            throw err;
        });

        logger.debug('loading cache for manifest(assets)');
    }

    /**
     *
     */
    static ensure_common(): void {
        if (this.common_manifest) {
            logger.debug(`Hit cache for manifest(common)`);
            return;
        }

        logger.debug('loading cache for manifest(common) from /game/manifest.json');
        this.common_manifest = loadJson('/game/manifest.json')
            .then(res => {
                logger.debug('Successfully loaded manifest(common)');
                return res;
            })
            .catch((err) => {
                this.common_manifest = undefined;
                logger.error('Failed to load manifest(common):', err);
                throw err;
            });
    }

    /**
     *
     */
    static ensure(): void {
        this.ensure_assets();
        this.ensure_common();
        logger.debug('loading cache for manifest(all)');
    }

    /**
     *
     */
    static async getAssetsManifest() {
        this.ensure();

        return this.assets_manifest;
    }

    /**
     *
     */
    static async getCommonManifest() {
        this.ensure();

        return this.common_manifest;
    }
}
