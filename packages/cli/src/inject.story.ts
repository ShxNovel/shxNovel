import type {
    useChapter as _useChapter,
    system as _system,
    character as _character,
    branch as _branch,
    // choice as _choice,
    jump as _jump,
    flag as _flag,
    directive as _directive,

    //
    scene as _scene,
    camera as _camera,
    visual as _visual,
    timelabel as _timelabel,
} from '@shxnovel/rewrite';

declare global {
    const useChapter: typeof _useChapter;
    /* Text */
    const character: typeof _character;

    /* Animate */
    const scene: typeof _scene;
    const camera: typeof _camera;
    const visual: typeof _visual;
    const timelabel: typeof _timelabel;

    /* System */
    const system: typeof _system;

    /* Control */
    const branch: typeof _branch;
    // const choice: typeof _choice;
    const jump: typeof _jump;
    const flag: typeof _flag;

    /* Directive */
    const directive: typeof _directive;
}
