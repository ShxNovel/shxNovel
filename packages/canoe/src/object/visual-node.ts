import * as THREE from 'three';
import { type Timeline } from 'animejs';
import { TextureManager } from '../resource/texture-manager';
import { ShaderManager } from '../resource/shader-manager';
import type { VisualNodeIR } from '@shxnovel/schema';
import { deserializeUniformValue, serializeUniformValue, type SerializedUniform } from '../utils/serialization';

export class VisualNode {
    public group: THREE.Group;
    public mesh: THREE.Mesh;
    public material: THREE.Material;
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

        // 1. Initialize with a simple transparent material to prevent any early render glitches
        this.material = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            visible: false
        });

        const geometry = new THREE.PlaneGeometry(1, 1);
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.visible = false; 
        
        this.group.add(this.mesh);

        // 2. Start async initialization
        this.ready = this.initShader(sharedUniforms);
    }

    async initShader(sharedUniforms: Record<string, THREE.IUniform>) {
        try {
            const [vShader, fShader] = await Promise.all([
                ShaderManager.get(this.config.vertexShader),
                ShaderManager.get(this.config.fragmentShader)
            ]);

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

            // Merge shared uniforms (uGroupAlpha, uTint)
            for (const [key, uniform] of Object.entries(sharedUniforms)) {
                uniforms[key] = uniform;
            }

            // 3. Create the REAL ShaderMaterial
            const shaderMaterial = new THREE.ShaderMaterial({
                transparent: true,
                side: THREE.DoubleSide,
                vertexShader: vShader.code,
                fragmentShader: fShader.code,
                uniforms: uniforms
            });

            // Swap the material
            this.mesh.material = shaderMaterial;
            this.material = shaderMaterial;

            if (this.config.size) {
                this.mesh.scale.set(this.config.size[0], this.config.size[1], 1);
                if (shaderMaterial.uniforms.uResolution) {
                    shaderMaterial.uniforms.uResolution.value.set(this.config.size[0], this.config.size[1]);
                }
                this.mesh.updateMatrix();
            }

            // 4. Finally show the mesh
            this.mesh.visible = true; 
        } catch (err) {
            console.error(`[VisualNode] Failed to initialize shader for ${this.name}:`, err);
        }
    }

    private get uniforms(): Record<string, THREE.IUniform> {
        if (this.material instanceof THREE.ShaderMaterial) {
            return this.material.uniforms;
        }
        return {};
    }

    async initVariant(variantName: string) {
        await this.ready;

        const Handle = this.config.variants[variantName];
        if (!Handle) return;

        let texture;
        if (Handle.use.type === 'texture') {
            texture = await TextureManager.get(Handle.use.name);
        }

        if (!texture) return;

        if (this.uniforms.uTexA) this.uniforms.uTexA.value = texture;
        if (this.uniforms.uMix) this.uniforms.uMix.value = 0;
        this.currentVariant = variantName;

        const img = texture.image as undefined | HTMLImageElement;
        const width = img?.width || 1;
        const height = img?.height || 1;

        if (this.uniforms.uResA) this.uniforms.uResA.value.set(width, height);

        if (img && width > 0 && height > 0) {
            this.mesh.scale.set(width, height, 1);
            if (this.uniforms.uResolution) this.uniforms.uResolution.value.set(width, height);
        }

        if (this.config.size) {
            this.mesh.scale.set(this.config.size[0], this.config.size[1], 1);
            if (this.uniforms.uResolution) this.uniforms.uResolution.value.set(this.config.size[0], this.config.size[1]);
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
            if (this.uniforms.uTexA) this.uniforms.uTexA.value = texture;
            if (this.uniforms.uResA) this.uniforms.uResA.value.set(targetWidth, targetHeight);
            if (this.uniforms.uMix) this.uniforms.uMix.value = 0;
            this.currentVariant = variantName;

            if (!this.config.size) {
                this.mesh.scale.set(targetWidth, targetHeight, 1);
                if (this.uniforms.uResolution) {
                    this.uniforms.uResolution.value.set(targetWidth, targetHeight);
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

        if (duration > 0 && this.uniforms.uMix) {
            // 1. 执行纹理混合动画
            tl.add(this.uniforms.uMix, {
                value: 1,
                duration,
                ease,
                onBegin: () => {
                    // 预处理：如果正在进行上一次转换，先归一化
                    if (this.uniforms.uMix.value > 0.5) {
                        if (this.uniforms.uTexA && this.uniforms.uTexB) {
                            this.uniforms.uTexA.value = (this.uniforms.uTexB.value as THREE.Texture);
                        }
                        if (this.uniforms.uResA && this.uniforms.uResB) {
                            this.uniforms.uResA.value.copy(this.uniforms.uResB.value);
                        }
                    }
                    this.uniforms.uMix.value = 0;
                    if (this.uniforms.uTexB) this.uniforms.uTexB.value = texture;
                    if (this.uniforms.uResB) this.uniforms.uResB.value.set(targetWidth, targetHeight);
                },
                onUpdate: () => {
                    // 核心修复：使用已经过 Ease 处理 of uMix.value 驱动尺寸插值
                    if (!this.config.size) {
                        const mix = this.uniforms.uMix.value;
                        const curW = startWidth + (targetWidth - startWidth) * mix;
                        const curH = startHeight + (targetHeight - startHeight) * mix;

                        this.mesh.scale.set(curW, curH, 1);
                        if (this.uniforms.uResolution) {
                            this.uniforms.uResolution.value.set(curW, curH);
                        }
                    }
                },
                onComplete: finalize
            }, position);
        } else {
            tl.add({
                duration: 0,
                onComplete: () => {
                    if (this.uniforms.uMix) this.uniforms.uMix.value = 1;
                    finalize();
                }
            }, position);
        }
    }

    async addUniformAnim(
        tl: Timeline,
        name: string,
        value: any,
        duration: number = 0,
        ease: string = 'inOutQuad',
        position?: string | number
    ): Promise<void> {
        await this.ready;
        const uniform = this.uniforms[name];
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

    async addVisibleAnim(tl: Timeline, visible: boolean, position?: string | number): Promise<void> {
        await this.ready;
        tl.add({
            duration: 0,
            onComplete: () => {
                this.group.visible = visible;
            }
        }, position);
    }

    getUniformsState() {
        const state: Record<string, SerializedUniform> = {};
        
        // 自动序列化所有在 config 中定义的 Uniforms
        if (this.config.uniforms) {
            for (const name of Object.keys(this.config.uniforms)) {
                const uniform = this.uniforms[name];
                if (!uniform || uniform.value === null || uniform.value === undefined) continue;

                const res = serializeUniformValue(uniform.value);
                if (res) {
                    state[name] = res;
                }
            }
        }

        // 始终序列化基础透明度
        const baseAlpha = this.uniforms['uBaseAlpha'];
        if (baseAlpha && baseAlpha.value !== undefined) {
            const res = serializeUniformValue(baseAlpha.value);
            if (res) state['uBaseAlpha'] = res;
        }

        return state;
    }

    async recoverUniforms(state: Record<string, SerializedUniform>) {
        await this.ready;
        const promises: Promise<void>[] = [];
        for (const [name, data] of Object.entries(state)) {
            if (!data || typeof data !== 'object' || !data.type) continue;

            const uniform = this.uniforms[name];
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
