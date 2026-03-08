export const sh_autoVertex = regShader("autoVertex", v => {
    v.code = `
        varying vec2 vUvA;
        varying vec2 vUvB;
        
        uniform vec2 uResolution;
        uniform vec2 uResA;
        uniform vec2 uResB;

        vec2 getCoverUv(vec2 uv, vec2 resolution, vec2 texRes) {
            if (texRes.x <= 0.0 || texRes.y <= 0.0 || resolution.x <= 0.0 || resolution.y <= 0.0) {
                return uv;
            }
            vec2 ratio = vec2(
                min((resolution.x / resolution.y) / (texRes.x / texRes.y), 1.0),
                min((resolution.y / resolution.x) / (texRes.y / texRes.x), 1.0)
            );
            return uv * ratio + (1.0 - ratio) * 0.5;
        }

        void main() {
            vUvA = getCoverUv(uv, uResolution, uResA);
            vUvB = getCoverUv(uv, uResolution, uResB);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
})

export const sh_autoFragment = regShader("autoFragment", v => {
    v.code = `
        uniform sampler2D uTexA;
        uniform sampler2D uTexB;
        uniform float uMix;
        
        uniform float uBaseAlpha;
        uniform float uGroupAlpha;
        uniform vec3 uTint;

        varying vec2 vUvA;
        varying vec2 vUvB;

        void main() {
            // 直接采样，无任何复杂计算
            vec4 colA = texture2D(uTexA, vUvA);
            vec4 colB = texture2D(uTexB, vUvB);
            
            vec4 finalCol = mix(colA, colB, uMix);
            
            float alpha = finalCol.a * uBaseAlpha * uGroupAlpha;
            gl_FragColor = vec4(finalCol.rgb * uTint, alpha);
            
            if (alpha < 0.001) discard;
        }
    `;
})