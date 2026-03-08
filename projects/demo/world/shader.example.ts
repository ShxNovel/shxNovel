export const sh_autoVertex = regShader("autoVertex", v => {
    v.code = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
})

export const sh_autoFragment = regShader("autoFragment", v => {
    v.code = `
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
    `;
})