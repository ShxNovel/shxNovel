export const p0 = regTexture("p0", t => {
  t.variants = "p0.png";
});

export const p1 = regTexture("p1", t => {
  t.variants = "p1.png";
});

export const p2 = regTexture("p2", t => {
  t.variants = "p2.png";
});

export const p3 = regTexture("p3", t => {
  t.variants = "p3.png";
});

regVisual("bg").nodes({
  body: {
    variants: {
      p0: p0,
      p1: p1,
      p2: p2,
      p3: p3,
    },
  },
});
