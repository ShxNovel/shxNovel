import { Timeline, createTimeline } from 'animejs';
import { logger } from '../logger';

export interface TimelineOptions {
    /**
     * Custom onComplete callback when the whole block finishes.
     */
    onComplete?: () => void;

    /**
     * Custom onUpdate callback for every frame.
     */
    onUpdate?: () => void;
}

export class TimelineBuilder {
    private static currentTL: Timeline | null = null;

    /**
     * Create a new timeline for a SceneBlock.
     * Automatically kills the previous one to prevent memory leaks.
     */
    static create(options: TimelineOptions = {}) {

        logger.debug('[TimelineBuilder] Create new timeline');

        if (this.currentTL) {
            this.kill();
        }

        this.currentTL = createTimeline({
            autoplay: false, // IMPORTANT: Prevent auto-playing
            onComplete: () => {
                options.onComplete?.();
            },
            onUpdate: () => {
                options.onUpdate?.();
            }
        });

        return this.currentTL;
    }

    /**
     * Add an animation to the current timeline.
     */
    static add(anim: any | null, position?: string | number) {
        if (!this.currentTL || !anim) return;
        this.currentTL.add(anim, position);
    }

    /**
     * Set a label at a specific position.
     */
    static timelabel(name: string, position?: string | number) {
        if (!this.currentTL) return;
        this.currentTL.label(name, position);
    }

    /**
     * Instantly jump to the end and cleanup.
     */
    static skip() {
        if (!this.currentTL) return;
        if (!this.currentTL.completed)
            this.currentTL.complete();
        this.kill();
    }

    /**
     * Kill the current timeline and release memory.
     */
    static kill() {
        if (this.currentTL) {
            this.currentTL.cancel();
            this.currentTL = null;
        }
    }

    static get active() {
        return this.currentTL;
    }
}
