import '@shxnovel/schema';

declare module "@shxnovel/schema" {
  namespace Assets {

    namespace Texture {
      interface Key {
        '104786518_p0.png': never;
        'p0.png': never;
        'p1.png': never;
        'p2.png': never;
        'p3.png': never;
        'some/a.jpg': never;
        'some/a.png': never;
        'some/b.png': never;
        'some/more/c.jpg': never;
      }
    }

    namespace Audio {
      interface Key {
        'a.mp3': never;
        'some/b.mp3': never;
      }
    }

  }
}
