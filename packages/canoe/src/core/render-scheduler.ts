import { shxActions } from './shx-actions';

class RenderScheduler {
    private dirty = false;
    private activeAnimations = 0;

    requestRender() {
        this.dirty = true;
    }

    animationStart() {
        this.activeAnimations++;
        this.dirty = true;
    }

    animationEnd() {
        this.activeAnimations--;
    }

    shouldRender() {
        shxActions.test().some(Boolean) && (this.dirty = true);
        // return 1;
        return this.dirty || this.activeAnimations > 0;
    }

    consume() {
        this.dirty = false;
    }
}

/** Decide when to render */
export const renderScheduler = new RenderScheduler();
