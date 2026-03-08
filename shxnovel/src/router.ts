import { Router, Commands } from '@vaadin/router';

import './pages';

const outlet = document.getElementById('game-outlet');

export const router = new Router(outlet);

router.setRoutes([
    { path: '/', component: 'logo-view' },

    { path: '/menu', component: 'main-menu' },

    { path: '/game', component: 'game-view' },

    { path: '/setting', component: 'game-setting' },

    { path: '/about', component: 'about-page' },

    {
        path: '/play',
        component: 'game-layout',
        children: [
            // 这里的 component 会被渲染到 game-layout 内部的 <slot> 中
            { path: '/scene/:sceneId', component: 'game-scene' },
        ],
    },

    // not found
    { path: '(.*)', component: 'not-found' },
]);

const originalRender = router.render;

// some hack
router.render = function (context) {
    // whether support View Transitions
    if (!document.startViewTransition) {
        // no support, default behavior
        return originalRender.call(this, context, true);
    }

    // support View Transitions
    return new Promise((resolve, reject) => {
        const transition = document.startViewTransition(async () => {
            try {
                // wait Vaadin Router finish DOM rendering
                // [warning] must await,
                //   otherwise View Transition will take screenshot before content updated
                const result = await originalRender.call(this, context, true);

                // inform Router
                resolve(result);
            } catch (error) {
                console.error('Render failed:', error);
                reject(error);
            }
        });

        transition.finished.catch((error) => {
            console.error('View transition failed:', error);
        });
    });
};
