import type {
    regScene as _regScene,
    regCamera as _regCamera,
    regRT as _regRT,
    regPipeline as _regPipeline,

    regTexture as _regTexture,
    regShader as _regShader,
    regVisual as _regVisual,

    useGlobalData as _useGlobalData,
    useInGameData as _useInGameData
} from '@shxnovel/world';

declare global {
    const regScene: typeof _regScene;
    const regCamera: typeof _regCamera;
    const regRT: typeof _regRT;
    const regPipeline: typeof _regPipeline;

    const regTexture: typeof _regTexture;
    const regShader: typeof _regShader;
    const regVisual: typeof _regVisual;

    const useGlobalData: typeof _useGlobalData;
    const useInGameData: typeof _useInGameData;
}