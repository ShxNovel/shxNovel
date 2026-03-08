import { eventController } from '../MListener';

type TimerId = ReturnType<typeof setTimeout>;

export const resolution = {
    w: 1920,
    h: 1080,
    get aspect() {
        return this.w / this.h;
    },
};

let resizeTimeout: TimerId;

window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(__solveResize, 30);
});

export type ResizeInfo = {
    width: number;
    height: number;
    imarginTop: number;
    imarginLeft: number;
    iwidth: number;
    iheight: number;
};

const resizeInfo: ResizeInfo = {
    width: document.documentElement.clientWidth,
    height: document.documentElement.clientHeight,
    imarginTop: 0,
    imarginLeft: 0,
    iwidth: 0,
    iheight: 0,
};

__solveResize();
function __solveResize() {
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    const A = resolution.aspect;

    Object.assign(resizeInfo, { width, height });

    if (width >= height) {
        const ia = width / height;
        if (A >= ia) {
            Object.assign(resizeInfo, {
                imarginTop: (height - width / A) / 2,
                imarginLeft: 0,
                iwidth: width,
                iheight: width / A,
            });
        } else {
            Object.assign(resizeInfo, {
                imarginTop: 0,
                imarginLeft: (width - height * A) / 2,
                iwidth: height * A,
                iheight: height,
            });
        }
    } else {
        const ia = height / width;
        if (A >= ia) {
            Object.assign(resizeInfo, {
                imarginTop: (width - height / A) / 2,
                imarginLeft: 0,
                iwidth: height,
                iheight: height / A,
            });
        } else {
            Object.assign(resizeInfo, {
                imarginTop: 0,
                imarginLeft: (height - width * A) / 2,
                iwidth: width * A,
                iheight: width,
            });
        }
    }

    eventController.emit('resize', resizeInfo);
}

export function getMediaRotateSize() {
    return resizeInfo;
}

export function hookEvent(event: string, fn: (...args: any[]) => any) {
    eventController.on(event, fn);
}
