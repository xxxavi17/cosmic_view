export const MotionBlurShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'velocityFactor': { value: 0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float velocityFactor;
        varying vec2 vUv;

        void main() {
            vec2 texCoord = vUv;
            vec4 color = texture2D(tDiffuse, texCoord);

            // Motion blur effect at borders
            float blurAmount = velocityFactor * 0.1; 
            float edgeThreshold = 0.1; 

            // Calculate distance from the edge
            float edgeDistance = min(vUv.x, 1.0 - vUv.x);
            edgeDistance = min(edgeDistance, min(vUv.y, 1.0 - vUv.y));

            if (edgeDistance < edgeThreshold) {
                float blurStrength = (edgeThreshold - edgeDistance) / edgeThreshold;
                vec4 sum = vec4(0.0);
                for (float i = -4.0; i <= 4.0; i++) {
                    for (float j = -4.0; j <= 4.0; j++) {
                        sum += texture2D(tDiffuse, texCoord + vec2(i, j) * 0.00005 * blurAmount);
                    }
                }
                color = mix(color, sum / 81.0, blurStrength); 
            }

            gl_FragColor = color;
        }
    `
};

