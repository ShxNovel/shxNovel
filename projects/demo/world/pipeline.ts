export const stage = regScene("main");
export const view = regCamera("main");
export const screen = regRT("screen");

regPipeline("main", p => {
  p.add({
    scene: stage,
    camera: view,
    output: screen,
  });
});
