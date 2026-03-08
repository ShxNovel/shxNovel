import * as THREE from 'three';
import { type Timeline } from 'animejs';
import { TextureManager } from '../resource/texture-manager';
import { ShaderManager } from '../resource/shader-manager';
import type { VisualNodeIR } from '@shxnovel/schema';
import { deserializeUniformValue, serializeUniformValue, type SerializedUniform } from '../utils/serialization';

export class VisualNode {
    public group: THREE.Group;
    public mesh: THREE.Mesh;
    public material: THREE.ShaderMaterial;
    public currentVariant: string = '';

    public ready: Promise<void>;

    constructor(
        public name: string,
        public config: VisualNodeIR,
        sharedUniforms: Record<string, THREE.IUniform>
    ) {
        this.group = new THREE.Group();
        this.group.name = `node_${name}`;

        if (config.pos) {
            this.group.position.set(config.pos[0] || 0, config.pos[1] || 0, config.pos[2] || 0);
        }

        // Initialize with basic material, will be updated in initShader
        this.material = new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.DoubleSide,
        });

        const geometry = new THREE.PlaneGeometry(1, 1);
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.group.add(this.mesh);

        this.ready = this.initShader(sharedUniforms);
    }

    async initShader(sharedUniforms: Record<string, THREE.IUniform>) {
        const [vShader, fShader] = await Promise.all([
            ShaderManager.get(this.config.vertexShader),
            ShaderManager.get(this.config.fragmentShader)
        ]);

        this.material.vertexShader = vShader.code;
        this.material.fragmentShader = fShader.code;

        const uniforms: Record<string, THREE.IUniform> = {};
        const promises: Promise<void>[] = [];

        if (this.config.uniforms) {
            for (const [uName, uData] of Object.entries(this.config.uniforms)) {
                const uniform: THREE.IUniform = { value: null };
                uniforms[uName] = uniform;
                promises.push(deserializeUniformValue(uniform, uData as any));
            }
        }

        await Promise.all(promises);
        this.material.uniforms = uniforms;

        for (const [key, uniform] of Object.entries(sharedUniforms)) {
            if (this.material.uniforms[key]) {
                this.material.uniforms[key] = uniform;
            }
        }

        if (this.config.size) {
            if (this.material.uniforms.uResolution) {
                this.material.uniforms.uResolution.value.set(this.config.size[0], this.config.size[1]);
            }
        }
    }

    async initVariant(variantName: string) {
        const Handle = this.config.variants[variantName];
        if (!Handle) return;

        let texture;
        if (Handle.use.type === 'texture') {
            texture = await TextureManager.get(Handle.use.name);
        }

        if (!texture) return;

        if (this.material.uniforms.uTexA) this.material.uniforms.uTexA.value = texture;
        if (this.material.uniforms.uMix) this.material.uniforms.uMix.value = 0;
        this.currentVariant = variantName;

        const img = texture.image as undefined | HTMLImageElement;
        const width = img?.width || 1;
        const height = img?.height || 1;

        if (this.material.uniforms.uResA) this.material.uniforms.uResA.value.set(width, height);

        if (img && width > 0 && height > 0) {
            this.mesh.scale.set(width, height, 1);
            if (this.material.uniforms.uResolution) this.material.uniforms.uResolution.value.set(width, height);
        }

        if (this.config.size) {
            this.mesh.scale.set(this.config.size[0], this.config.size[1], 1);
            if (this.material.uniforms.uResolution) this.material.uniforms.uResolution.value.set(this.config.size[0], this.config.size[1]);
        }

        this.mesh.updateMatrix();
    }

    /**
     * 构建变体切换动画
     */
    async addVariantAnim(
        tl: Timeline,
        variantName: string,
        duration: number = 0,
        ease: string = 'inOutQuad',
        position?: string | number
    ): Promise<void> {
        await this.ready;

        const Handle = this.config.variants[variantName];
        if (!Handle) return;

        let texture;
        if (Handle.use.type === 'texture') {
            texture = await TextureManager.get(Handle.use.name);
        } else {
            return;
        }

        const img = texture.image as HTMLImageElement;
        const targetWidth = img?.width || 1;
        const targetHeight = img?.height || 1;

        const finalize = () => {
            if (this.material.uniforms.uTexA) this.material.uniforms.uTexA.value = texture;
            if (this.material.uniforms.uResA) this.material.uniforms.uResA.value.set(targetWidth, targetHeight);
            if (this.material.uniforms.uMix) this.material.uniforms.uMix.value = 0;
            this.currentVariant = variantName;

            if (!this.config.size) {
                this.mesh.scale.set(targetWidth, targetHeight, 1);
                if (this.material.uniforms.uResolution) {
                    this.material.uniforms.uResolution.value.set(targetWidth, targetHeight);
                }
            }
        };

        if (this.currentVariant === variantName) {
            tl.add({ duration: 0, onComplete: finalize }, position);
            return;
        }

        // 获取当前尺寸作为动画起点
        const startWidth = this.mesh.scale.x;
        const startHeight = this.mesh.scale.y;

        if (duration > 0 && this.material.uniforms.uMix) {
            // 1. 执行纹理混合动画
            tl.add(this.material.uniforms.uMix, {
                value: 1,
                duration,
                ease,
                onBegin: () => {
                    // 预处理：如果正在进行上一次转换，先归一化
                    if (this.material.uniforms.uMix.value > 0.5) {
                        if (this.material.uniforms.uTexA && this.material.uniforms.uTexB) {
                            this.material.uniforms.uTexA.value = (this.material.uniforms.uTexB.value as THREE.Texture);
                        }
                        if (this.material.uniforms.uResA && this.material.uniforms.uResB) {
                            this.material.uniforms.uResA.value.copy(this.material.uniforms.uResB.value);
                        }
                    }
                    this.material.uniforms.uMix.value = 0;
                    if (this.material.uniforms.uTexB) this.material.uniforms.uTexB.value = texture;
                    if (this.material.uniforms.uResB) this.material.uniforms.uResB.value.set(targetWidth, targetHeight);
                },
                onUpdate: () => {
                    // 核心修复：使用已经过 Ease 处理的 uMix.value 驱动尺寸插值
                    if (!this.config.size) {
                        const mix = this.material.uniforms.uMix.value;
                        const curW = startWidth + (targetWidth - startWidth) * mix;
                        const curH = startHeight + (targetHeight - startHeight) * mix;

                        this.mesh.scale.set(curW, curH, 1);
                        if (this.material.uniforms.uResolution) {
                            this.material.uniforms.uResolution.value.set(curW, curH);
                        }
                    }
                },
                onComplete: finalize
            }, position);
        } else {
            tl.add({
                duration: 0,
                onComplete: () => {
                    if (this.material.uniforms.uMix) this.material.uniforms.uMix.value = 1;
                    finalize();
                }
            }, position);
        }
    }

    addUniformAnim(
        tl: Timeline,
        name: string,
        value: any,
        duration: number = 0,
        ease: string = 'inOutQuad',
        position?: string | number
    ): void {
        const uniform = this.material.uniforms[name];
        if (!uniform) return;

        if (duration > 0) {
            tl.add(uniform, {
                value,
                duration,
                ease,
            }, position);
        } else {
            tl.add({
                duration: 0,
                onComplete: () => {
                    if (uniform.value && typeof (uniform.value as any).set === 'function') {
                        (uniform.value as any).set(value);
                    } else {
                        uniform.value = value;
                    }
                }
            }, position);
        }
    }

    addVisibleAnim(tl: Timeline, visible: boolean, position?: string | number): void {
        tl.add({
            duration: 0,
            onComplete: () => {
                this.group.visible = visible;
            }
        }, position);
    }

    public serializableUniforms: Set<string> = new Set(['uBaseAlpha']);

    getUniformsState() {
        const state: Record<string, SerializedUniform> = {};
        for (const name of this.serializableUniforms) {
            const uniform = this.material.uniforms[name];
            if (!uniform || uniform.value === null || uniform.value === undefined) continue;

            const res = serializeUniformValue(uniform.value);
            if (res) {
                state[name] = res;
            }
        }
        return state;
    }

    async recoverUniforms(state: Record<string, SerializedUniform>) {
        const promises: Promise<void>[] = [];
        for (const [name, data] of Object.entries(state)) {
            if (!data || typeof data !== 'object' || !data.type) continue;

            const uniform = this.material.uniforms[name];
            if (!uniform) continue;

            promises.push(deserializeUniformValue(uniform, data));
        }
        await Promise.all(promises);
    }
}

export interface VisualNodeState {
    variant: string;
    visible: boolean;
    uniforms: Record<string, SerializedUniform>;
}
