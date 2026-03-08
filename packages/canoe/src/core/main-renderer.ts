import { WebGLRenderer } from 'three';
import { engine } from 'animejs';

engine.defaults.autoplay = false;

engine.defaults.composition = 'replace';

/** default renderer */
export const MainRenderer = new WebGLRenderer({
    antialias: true,
});

// @ts-ignore
window.mainRenderer = MainRenderer;

// Set a safe initial size, FinalPass will override this almost immediately
MainRenderer.setPixelRatio(window.devicePixelRatio);
MainRenderer.setSize(1920, 1080);
