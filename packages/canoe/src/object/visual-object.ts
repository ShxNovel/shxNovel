import * as THREE from 'three';
import { createTimeline, type Timeline } from 'animejs';
import { renderScheduler } from '../core/render-scheduler';
import { TextureManager } from '../resource/texture-manager';
import { ShaderManager } from '../resource/shader-manager';
import { proxyProp } from '../utils/decorators';
import type { VisualIR, VisualNodeIR } from '@shxnovel/schema';
import { isColor } from '../utils/typeCheck';
import { deserializeUniformValue, serializeUniformValue, type SerializedUniform } from '../utils/serialization';

// import { logger } from '../logger';

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
        // Fetch actual GLSL code from ShaderManager
        const [vShader, fShader] = await Promise.all([
            ShaderManager.get(this.config.vertexShader),
            ShaderManager.get(this.config.fragmentShader)
        ]);

        this.material.vertexShader = vShader.code;
        this.material.fragmentShader = fShader.code;
        
        // Initialize uniforms from config
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

        // Merge shared uniforms
        for (const [key, uniform] of Object.entries(sharedUniforms)) {
            if (this.material.uniforms[key]) {
                this.material.uniforms[key] = uniform;
            }
        }

        // Init resolution if size is fixed
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

        switch (Handle.use.type) {
            case 'texture':
                texture = await TextureManager.get(Handle.use.name);
                break;
        }

        if (!texture) return;

        if (this.material.uniforms.uTexA) this.material.uniforms.uTexA.value = texture;
        if (this.material.uniforms.uMix) this.material.uniforms.uMix.value = 0;
        this.currentVariant = variantName;

        const img = texture.image as undefined | HTMLImageElement;
        const width = img?.width || 1;
        const height = img?.height || 1;

        // Set texture resolution
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
     * Returns a Timeline for variant switching
     * Logic: Normalizes state to uMix = 0 via callbacks to prevent Anime.js property overrides.
     */
    async switchToVariant(
        variantName: string,
        duration: number = 0,
        ease: string = 'inOutQuad'
    ): Promise<{ anim: Timeline } | null> {

        await this.ready;

        const Handle = this.config.variants[variantName];
        if (!Handle) return null;

        let texture;

        if (Handle.use.type === 'texture') {
            texture = await TextureManager.get(Handle.use.name);
        } else {
            throw new Error(`Unsupported variant kind: ${Handle.use.type}`);
        }

        const img = texture.image as HTMLImageElement;
        const width = img?.width || 1;
        const height = img?.height || 1;

        const finalize = () => {
            if (this.material.uniforms.uTexA) this.material.uniforms.uTexA.value = texture;
            if (this.material.uniforms.uResA) this.material.uniforms.uResA.value.set(width, height);
            if (this.material.uniforms.uMix) this.material.uniforms.uMix.value = 0;
            this.currentVariant = variantName;

            if (!this.config.size) {
                this.mesh.scale.set(width, height, 1);
                if (this.material.uniforms.uResolution) this.material.uniforms.uResolution.value.set(width, height);
            }
        };

        const tl = createTimeline({
            autoplay: false,
            // 1. Pre-Normalization: Ensure we start from uMix=0
            onBegin: () => {
                if (this.material.uniforms.uMix && this.material.uniforms.uMix.value > 0.5) {
                    if (this.material.uniforms.uTexA && this.material.uniforms.uTexB) {
                        this.material.uniforms.uTexA.value = (this.material.uniforms.uTexB.value as THREE.Texture);
                    }
                    if (this.material.uniforms.uResA && this.material.uniforms.uResB) {
                        this.material.uniforms.uResA.value.copy(this.material.uniforms.uResB.value);
                    }
                }
                if (this.material.uniforms.uMix) this.material.uniforms.uMix.value = 0;
                if (this.material.uniforms.uTexB) this.material.uniforms.uTexB.value = texture;
                if (this.material.uniforms.uResB) this.material.uniforms.uResB.value.set(width, height);
            }
        });

        if (this.currentVariant === variantName) {
            tl.call(finalize);
            return { anim: tl };
        }

        // 2. Drive the transition (A -> B)
        if (duration > 0 && this.material.uniforms.uMix) {
            tl.add(this.material.uniforms.uMix, {
                value: 1,
                duration,
                ease,
                onComplete: finalize
            });
        } else {
            tl.call(() => {
                if (this.material.uniforms.uMix) this.material.uniforms.uMix.value = 1;
                finalize();
            });
        }

        return { anim: tl };
    }

    setUniform(
        name: string,
        value: any,
        duration: number = 0,
        ease: string = 'inOutQuad'
    ): Timeline | null {

        const uniform = this.material.uniforms[name];
        if (!uniform) return null;

        const tl = createTimeline({ autoplay: false });

        if (duration > 0) {
            tl.add(uniform, {
                value,
                duration,
                ease,
            });
        } else {
            tl.call(() => {
                // Safe assignment for Three.js objects (like Color)
                if (uniform.value && typeof (uniform.value as any).set === 'function') {
                    (uniform.value as any).set(value);
                } else {
                    uniform.value = value;
                }
            });
        }
        return tl;
    }

    getVisibleAnim(visible: boolean): Timeline {
        const tl = createTimeline({ autoplay: false });
        tl.call(() => {
            this.group.visible = visible;
        });
        return tl;
    }

    // Whitelist of uniforms to be serialized
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
            // Check data structure
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

export interface VisualObjectState {
    name: string;
    visible: boolean;
    position: [number, number, number];
    scale: [number, number, number];
    rotation: [number, number, number];
    groupAlpha: number;
    tint: number; // Hex color
    nodes: Record<string, VisualNodeState>;
}

export class VisualObject extends THREE.Group {
    private nodes = new Map<string, VisualNode>();
    public exprMap = new Map<string, any>();
    private sharedUniforms: Record<string, THREE.IUniform> = {
        uGroupAlpha: { value: 1 },
        uTint: { value: new THREE.Color(1, 1, 1) },
    };

    constructor(public name: string, private ir: VisualIR) {
        super();
        this.buildHierarchy();
        this.setupExprs();
    }

    private buildHierarchy() {
        const nodeConfigs = this.ir.nodes;
        const tempNodes = new Map<string, VisualNode>();
        for (const [name, config] of Object.entries(nodeConfigs)) {
            const node = new VisualNode(name, config, this.sharedUniforms);
            tempNodes.set(name, node);
            this.nodes.set(name, node);
        }
        for (const [name, config] of Object.entries(nodeConfigs)) {
            const node = tempNodes.get(name)!;
            const parentName = (config as any).parent;
            if (parentName && parentName !== 'root' && tempNodes.has(parentName)) {
                tempNodes.get(parentName)!.group.add(node.group);
            } else {
                this.add(node.group);
            }
        }
    }

    private setupExprs() {
        if (this.ir.exprs) {
            for (const [name, expr] of Object.entries(this.ir.exprs)) {
                this.exprMap.set(name, expr);
            }
        }
    }

    async loadDefaults() {
        const promises: Promise<void>[] = [];
        for (const [_name, node] of this.nodes) {
            const firstVariant = Object.keys(node.config.variants)[0];
            if (firstVariant) promises.push(node.initVariant(firstVariant));
        }
        await Promise.all(promises);
    }

    async applyExpression(exprName: string, options: { duration?: number; ease?: string; } = {}): Promise<{ anim: Timeline } | null> {
        const expr = this.exprMap.get(exprName);
        if (!expr) return null;

        const { target, variant, visible, uniforms } = expr;
        const duration = options.duration ?? 300;
        const ease = options.ease ?? 'inOutQuad';

        const tl = createTimeline({ autoplay: false });

        let hasAction = false;

        // --- Path A: Global Object Properties (target: self) ---
        if (target === 'self') {
            if (!uniforms) return null;

            for (const [uName, uValue] of Object.entries(uniforms)) {
                const sharedUniform = this.sharedUniforms[uName];
                if (!sharedUniform) continue;

                if (duration > 0) {
                    tl.add(sharedUniform, {
                        value: uValue as any,
                        duration,
                        ease,
                    }, 0);
                } else {
                    tl.call(() => {
                        if (sharedUniform.value && typeof (sharedUniform.value as any).set === 'function') {
                            (sharedUniform.value as any).set(uValue);
                        } else {
                            sharedUniform.value = uValue;
                        }
                    });
                }
                hasAction = true;
            }
            return hasAction ? { anim: tl } : null;
        }

        // --- Path B: Node Specific Properties ---
        const node = this.nodes.get(target);
        if (!node) return null;

        if (variant) {
            const res = await node.switchToVariant(variant, duration, ease);
            if (res?.anim) {
                tl.sync(res.anim, 0);
                hasAction = true;
            }
        }

        if (visible !== undefined) {
            tl.sync(node.getVisibleAnim(visible), 0);
            hasAction = true;
        }

        if (uniforms) {
            for (const [uName, uValue] of Object.entries(uniforms)) {
                const anim = node.setUniform(uName, uValue, duration, ease);
                if (!anim) continue;
                tl.sync(anim, 0);
                hasAction = true;
            }
        }

        return hasAction ? { anim: tl } : null;
    }

    @proxyProp('position.x') x!: number;
    @proxyProp('position.y') y!: number;
    @proxyProp('position.z') z!: number;

    @proxyProp('scale.x') scaleX!: number;
    @proxyProp('scale.y') scaleY!: number;
    @proxyProp('scale.z') scaleZ!: number;

    @proxyProp('rotation.x') rotationX!: number;
    @proxyProp('rotation.y') rotationY!: number;
    @proxyProp('rotation.z') rotationZ!: number;

    get scaleAll() { return this.scale.x; }
    set scaleAll(v) { this.scale.set(v, v, v); }

    get opacity() { return this.sharedUniforms.uGroupAlpha.value; }
    set opacity(v) { this.sharedUniforms.uGroupAlpha.value = v; }

    get tint() { return this.sharedUniforms.uTint.value; }
    set tint(v: THREE.Color | number | string) {
        if (isColor(v)) {
            this.sharedUniforms.uTint.value.copy(v);
        } else {
            this.sharedUniforms.uTint.value.set(v);
        }
    }

    getState(): VisualObjectState {
        const nodesState: Record<string, VisualNodeState> = {};
        for (const [name, node] of this.nodes) {
            nodesState[name] = {
                variant: node.currentVariant,
                visible: node.group.visible,
                uniforms: node.getUniformsState()
            };
        }
        return {
            name: this.name,
            visible: this.visible,
            position: [this.position.x, this.position.y, this.position.z],
            scale: [this.scale.x, this.scale.y, this.scale.z],
            rotation: [this.rotation.x, this.rotation.y, this.rotation.z],
            nodes: nodesState,
            groupAlpha: this.opacity,
            tint: this.sharedUniforms.uTint.value.getHex()
        };
    }

    async recover(state: VisualObjectState) {
        this.visible = state.visible;
        this.position.set(state.position[0], state.position[1], state.position[2]);
        this.scale.set(state.scale[0], state.scale[1], state.scale[2]);
        this.rotation.set(state.rotation[0], state.rotation[1], state.rotation[2]);

        for (const [name, nodeState] of Object.entries(state.nodes)) {
            const node = this.nodes.get(name);
            if (!node) continue;

            await node.initVariant(nodeState.variant);
            node.group.visible = nodeState.visible;
            await node.recoverUniforms(nodeState.uniforms);
        }

        this.opacity = state.groupAlpha;
        if (state.tint !== undefined) {
            this.sharedUniforms.uTint.value.setHex(state.tint);
        }
        renderScheduler.requestRender();
    }
}
