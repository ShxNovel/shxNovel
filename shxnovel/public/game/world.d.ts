import '@shxnovel/schema';

declare module "@shxnovel/schema" {

  namespace Animate {
    interface VisualMap {
      'v_stand': {
        pose: never;
        expr: 'body:s1' | 'body:s2' | 'v#body' | 'u#body' | '1#body' | '0#body' | '1#self' | '0#self';
      };

      'v_transition': {
        pose: never;
        expr: 'v#main' | 'u#main' | '1#main' | '0#main' | '1#self' | '0#self' | 'fade_in' | 'fade_out';
      };

      'v_blinds': {
        pose: never;
        expr: 'v#main' | 'u#main' | '1#main' | '0#main' | '1#self' | '0#self' | 'open' | 'close';
      };

      'v_fx_trans': {
        pose: never;
        expr: 'v#main' | 'u#main' | '1#main' | '0#main' | '1#self' | '0#self' | 'appear' | 'disappear';
      };

      'v_bg': {
        pose: never;
        expr: 'body:p0' | 'body:p1' | 'body:p2' | 'body:p3' | 'v#body' | 'u#body' | '1#body' | '0#body' | '1#self' | '0#self';
      };

    }

    interface SceneMap {
      "s_main": any;
    }

    interface CameraMap {
      "c_main": "o";
    }

    interface RTMap {
      "rt_screen": any;
    }

    interface PipelineMap {
      "pipe_main": any;
    }

  }

  namespace GameData {
    interface InGame {
      a: number;
      b: number;
    }

    interface Global {
      c: number;
      d: number;
    }
  }
}
