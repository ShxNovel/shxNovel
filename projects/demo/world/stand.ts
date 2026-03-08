export const s1 = regTexture("s1", t => {
  t.variants = "stand1.png";
});

export const s2 = regTexture("s2", t => {
  t.variants = "stand2.png";
});

regVisual("stand").nodes({
  body: {
    variants: {
      s1: s1,
      s2: s2,
    },
  },
});
