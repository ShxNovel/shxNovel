// A dedicated Visual for screen transitions
import { regVisual, regShader } from "@shxnovel/world";

// --- 1. Vertex Shader (Shared) ---
export const sh_transition_vert = regShader("transitionVertex", v => {
    v.code = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
});

// --- 2. Fade Fragment Shader ---
export const sh_transition_frag = regShader("transitionFragment", v => {
    v.code = `
        precision highp float;
        uniform float uDarkness;   // 0.0 is transparent, 1.0 is fully black
        uniform float uGroupAlpha; // Global alpha from engine
        uniform vec3 uTint;        // Standard tint
        varying vec2 vUv;

        void main() {
            float alpha = uDarkness * uGroupAlpha;
            gl_FragColor = vec4(uTint * 0.0, alpha); // Black tinted by uTint (usually black)
            if (alpha < 0.001) discard;
        }
    `;
});

// --- 3. Blinds Fragment Shader ---
export const sh_blinds_frag = regShader("blindsFragment", v => {
    v.code = `
        precision highp float;
        uniform float uProgress;   // 0.0 to 1.0
        uniform float uCount;      // Number of blinds
        uniform float uGroupAlpha;
        uniform vec3 uTint;
        varying vec2 vUv;

        void main() {
            // Calculate stripe mask
            float stripe = fract(vUv.y * uCount);
            float mask = step(stripe, uProgress);
            
            float alpha = mask * uGroupAlpha;
            gl_FragColor = vec4(uTint * 0.0, alpha);
            if (alpha < 0.001) discard;
        }
    `;
});

// --- 4. Diamond Dissolve (碎片溶解) ---
export const sh_diamond_frag = regShader("diamondDissolveFragment", v => {
    v.code = `
        precision highp float;
        uniform float uProgress;   // 0.0 to 1.0
        uniform float uSize;       // Size of diamonds
        uniform float uSmoothness; // Edge smoothness
        uniform float uGroupAlpha;
        uniform vec3 uTint;
        varying vec2 vUv;

        void main() {
            // Create a diamond pattern
            // Using Manhattan distance logic: |x| + |y|
            vec2 p = vUv * uSize;
            vec2 ip = floor(p);
            vec2 fp = fract(p);
            
            // Transform local square coordinates to diamond distance
            float dist = abs(fp.x - 0.5) + abs(fp.y - 0.5);
            
            // Offset the distance based on screen position to create a spreading effect
            // (e.g., from top-left to bottom-right)
            float spreading = (vUv.x + vUv.y) * 0.5;
            float threshold = uProgress * (1.0 + uSmoothness);
            
            // Combine diamond pattern with spreading logic
            float mask = smoothstep(threshold - uSmoothness, threshold, dist + spreading * 0.5);
            
            // Invert mask for 'opening' effect
            mask = 1.0 - mask;

            float alpha = mask * uGroupAlpha;
            gl_FragColor = vec4(uTint * 0.0, alpha);
            if (alpha < 0.001) discard;
        }
    `;
});

// --- Visuals ---

export const v_transition = regVisual("transition").nodes({
    main: {
        size: [3000, 3000], 
        vertexShader: sh_transition_vert,
        fragmentShader: sh_transition_frag,
        uniforms: {
            uDarkness: { type: 'number', value: 0.0 },
            uGroupAlpha: { type: 'number', value: 1.0 },
            uTint: { type: 'color', value: 0x000000 }
        }
    }
}).exprs({
    "fade_in": { target: "main", uniforms: { uDarkness: 1.0 } },
    "fade_out": { target: "main", uniforms: { uDarkness: 0.0 } }
});

export const v_blinds = regVisual("blinds").nodes({
    main: {
        size: [3000, 3000],
        vertexShader: sh_transition_vert,
        fragmentShader: sh_blinds_frag,
        uniforms: {
            uProgress: { type: 'number', value: 0.0 },
            uCount: { type: 'number', value: 10.0 },
            uGroupAlpha: { type: 'number', value: 1.0 },
            uTint: { type: 'color', value: 0x000000 }
        }
    }
}).exprs({
    "open": { target: "main", uniforms: { uProgress: 1.0 } },
    "close": { target: "main", uniforms: { uProgress: 0.0 } }
});

export const v_fx_trans = regVisual("fx_trans").nodes({
    main: {
        size: [3000, 3000],
        vertexShader: sh_transition_vert,
        fragmentShader: sh_diamond_frag,
        uniforms: {
            uProgress: { type: 'number', value: 0.0 },
            uSize: { type: 'number', value: 20.0 },       // 菱形密度
            uSmoothness: { type: 'number', value: 0.2 }, // 边缘柔和度
            uGroupAlpha: { type: 'number', value: 1.0 },
            uTint: { type: 'color', value: 0x000000 }
        }
    }
}).exprs({
    "appear": { target: "main", uniforms: { uProgress: 1.5 } }, // 1.5 ensures complete coverage
    "disappear": { target: "main", uniforms: { uProgress: 0.0 } }
});
