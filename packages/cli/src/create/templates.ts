export const TEMPLATES = {
  packageJson: (name: string) => `{
    "name": "${name}",
    "private": true,
    "version": "1.0.0",
    "description": "ShxNovel visual novel project",
    "main": "index.js",
    "scripts": {
        "build:asset": "shx-cli asset",
        "build:world": "shx-cli world",
        "build:story": "shx-cli story",
        "build:bound": "shx-cli bound",
        "build": "pnpm build:asset && pnpm build:world && pnpm build:story",
        "use": "shx-cli use",
        "init": "pnpm i"
    },
    "dependencies": {
        "@shxnovel/rewrite": "workspace:*",
        "@shxnovel/world": "workspace:*",
        "@shxnovel/cli": "workspace:*",
        "json-to-ts": "*",
        "tsx": "*"
    },
    "keywords": [],
    "packageManager": "pnpm@10.8.0"
}
`,

  tsconfigJson: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",

    "declaration": true,
    "outDir": "types",
    "emitDeclarationOnly": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,

    "types": ["@shxnovel/cli", "@shxnovel/world"]
  },
  "include": ["./.vn/*", "./plugins/*", "./story", "./world"]
}
`,

  prettierrc: `{
  "arrowParens": "avoid"
}
`,

  vnManifest: `{
  "meta": {"version": "1.0", "engine": "ShxNovel"},
  "resourceList": {}
}
`,

  storyConfig: `export default {
    entry: '1.1.1',
};
`,

  storyExample: `useChapter("1.1.1");

const aside = character(null);
const me = character("卡咖喱");

const stage = scene("s_main");
const school = visual("v_bg");

flag("start");

aside\`静谧的森林中，温和的阳光从树叶的空隙间筛落下来。\`;

school.enter(p => {
  p.into(stage);
  p.expr("body:p0");
});

me\`滴答。\`;

aside\`一阵水声突然响彻其间。\`

me\`神人 —— 正张大了嘴呆站在那里。\`

aside\`是一个女孩。他的眼前有个全裸的女孩。\`

school.leave();

jump("start");
`,

  worldPipeline: `export const stage = regScene("main");
export const view = regCamera("main");
export const screen = regRT("screen");

regPipeline("main", p => {
  p.add({
    scene: stage,
    camera: view,
    output: screen,
  });
});
`,

  worldDataExample: `import { useInGameData, useGlobalData } from "@shxnovel/world";

useInGameData({
  a: 1,
  b: 2,
});

useGlobalData({
  c: 3,
  d: 4,
});
`,

  worldVisualExample: `export const p0 = regTexture("p0", t => {
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

`,

  worldShaderExample: `export const defaultNode = regShader('defaultNode', f => {
    f.uniforms = {
        uTexA: { type: 'texture', value: null },
        uTexB: { type: 'texture', value: null },
        uMix: { type: 'number', value: 0 },

        // Resolution uniforms for object-fit: cover
        uResolution: { type: 'vec2', value: [1, 1] }, // Container (Mesh) size
        uResA: { type: 'vec2', value: [1, 1] },       // Texture A size
        uResB: { type: 'vec2', value: [1, 1] },       // Texture B size

        uBaseAlpha: { type: 'number', value: 1 },
        uGroupAlpha: { type: 'number', value: 1 },
        uTint: { type: 'color', value: 0xffffff }, // new THREE.Color(1, 1, 1)
    };

    f.vertex = \`
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    \`;

    f.fragment = \`
        uniform sampler2D uTexA;
        uniform sampler2D uTexB;
        uniform float uMix;
        
        uniform vec2 uResolution;
        uniform vec2 uResA;
        uniform vec2 uResB;

        uniform float uBaseAlpha;
        uniform float uGroupAlpha;
        uniform vec3 uTint;
        varying vec2 vUv;

        vec2 getCoverUv(vec2 uv, vec2 resolution, vec2 texRes) {
            // Avoid division by zero
            if (texRes.x == 0.0 || texRes.y == 0.0 || resolution.x == 0.0 || resolution.y == 0.0) {
                return uv;
            }

            vec2 ratio = vec2(
                min((resolution.x / resolution.y) / (texRes.x / texRes.y), 1.0),
                min((resolution.y / resolution.x) / (texRes.y / texRes.x), 1.0)
            );

            return vec2(
                uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
                uv.y * ratio.y + (1.0 - ratio.y) * 0.5
            );
        }

        void main() {
            vec2 uvA = getCoverUv(vUv, uResolution, uResA);
            vec2 uvB = getCoverUv(vUv, uResolution, uResB);

            vec4 colA = texture2D(uTexA, uvA);
            vec4 colB = texture2D(uTexB, uvB);
            vec4 finalCol = mix(colA, colB, uMix);
            
            float alpha = finalCol.a * uBaseAlpha * uGroupAlpha;
            gl_FragColor = vec4(finalCol.rgb * uTint, alpha);
            
            if (alpha < 0.001) discard;
        }
    \`;
});
`,
};
