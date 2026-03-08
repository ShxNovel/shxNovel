export declare namespace GameData {
    interface InGame { }

    interface Global { }

    interface Impl {
        inGame: InGame;
        global: Global;
    }
}

export declare namespace Animate {
    interface VisualMap {
        // test: {
        //     expr: 'epxr1' | 'expr2';
        // };
    }
    type VisualKey = keyof VisualMap;
    type VisualExprName<T> = T extends keyof VisualMap ? VisualMap[T]['expr'] : never;

    interface VisualPositionMap { }
    type VisualPositionKey = keyof VisualPositionMap;

    interface SceneMap {
        // 'scene:main': any;
    }
    type SceneKey = keyof SceneMap;

    interface CameraMap {
        // 'co:main': 'o';
        // 'co:some1': 'o';
        // 'cp:some2': 'p';
    }
    type CameraKey = PersCameraKey | OrthCameraKey;
    type PersCameraKey = KeysOfValue<CameraMap, 'p'>;
    type OrthCameraKey = KeysOfValue<CameraMap, 'o'>;

    interface RTMap {
        // screen: any;
    }
    type RTKey = keyof RTMap;

    interface PipelineMap {
        // main: any;
    }
    type PipelineKey = keyof PipelineMap;
}

type KeysOfValue<T, TCondition> = keyof {
    [K in keyof T as T[K] extends TCondition ? K : never]: T[K];
};
