import { ResizeInfo, getMediaRotateSize, hookEvent } from './';
import { renderScheduler, finalPass } from '@shxnovel/canoe';
//
// Note:
//
// if    width < height
// then  rorate the screen
//       width & height on screan will swap
//

//
// remind that
//       :root { --var-width, --var-height }
//       is the behavior, instead of true device size
//

const W = 1920,
    H = 1080,
    A = W / H;

function solveResize(data: ResizeInfo = getMediaRotateSize()) {
    const { width, height, imarginTop, imarginLeft, iwidth, iheight } = data;
    const rootStyle = document.documentElement.style;
    const bodyStyle = document.getElementsByTagName('body')[0].style;

    if (width >= height) {
        rootStyle.setProperty('--var-width', `${width}px`);
        rootStyle.setProperty('--var-height', `${height}px`);
        rootStyle.setProperty('width', `${width}px`);
        rootStyle.setProperty('height', `${height}px`);
        // rootStyle.setProperty('font-size', `${16 * width / 1920}px`);

        bodyStyle.setProperty('transform', `rotate(0deg)`);
        bodyStyle.setProperty('transform-origin', `unset`);

        finalPass.resize(width, height);
        renderScheduler.requestRender();
    } else {
        rootStyle.setProperty('--var-width', `${height}px`);
        rootStyle.setProperty('--var-height', `${width}px`);
        rootStyle.setProperty('width', `${width}px`);
        rootStyle.setProperty('height', `${height}px`);
        // rootStyle.setProperty('font-size', `${16 * height / 1920}px`);

        bodyStyle.setProperty('transform', `rotate(90deg)`);
        bodyStyle.setProperty('transform-origin', `${width / 2}px ${width / 2}px`);

        finalPass.resize(height, width);
        renderScheduler.requestRender();
    }

    rootStyle.setProperty('--var-imarginTop', `${imarginTop}px`);
    rootStyle.setProperty('--var-imarginLeft', `${imarginLeft}px`);
    rootStyle.setProperty('--var-iwidth', `${iwidth}px`);
    rootStyle.setProperty('--var-iheight', `${iheight}px`);

    const FontSize = (24 * iwidth) / 1920;
    rootStyle.setProperty('font-size', `${FontSize}px`);


}

solveResize(getMediaRotateSize());

window.addEventListener('DOMContentLoaded', () => {
    solveResize(getMediaRotateSize());
});

hookEvent('resize', (data: ResizeInfo) => {
    solveResize(data);
});

export { solveResize };
