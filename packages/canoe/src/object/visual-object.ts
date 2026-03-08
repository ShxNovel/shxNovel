import * as THREE from 'three';
import { type Timeline } from 'animejs';
import { renderScheduler } from '../core/render-scheduler';
import { proxyProp } from '../utils/decorators';
import type { VisualIR } from '@shxnovel/schema';
import { isColor } from '../utils/typeCheck';
import { VisualNode, type VisualNodeState } from './visual-node';
import { SceneManager } from '../resource/scene-manager';

export interface VisualObjectState {
    name: string;
    visible: boolean;
    position: [number, number, number];
    scale: [number, number, number];
    rotation: [number, number, number];
    groupAlpha: number;
    tint: number; // Hex color
    nodes: Record<string, VisualNodeState>;
    parentName?: string; // 记录挂载的场景
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

    /**
     * 将表达式动画直接添加到给定的 Timeline 中
     */
    async addExpressionAnim(
        tl: Timeline,
        exprName: string,
        options: { duration?: number; ease?: string; position?: string | number; } = {}
    ): Promise<void> {
        const expr = this.exprMap.get(exprName);
        if (!expr) return;

        const { target, variant, visible, uniforms } = expr;
        const duration = options.duration ?? 300;
        const ease = options.ease ?? 'inOutQuad';
        const position = options.position;

        // --- Path A: Global Object Properties (target: self) ---
        if (target === 'self') {
            if (!uniforms) return;

            for (const [uName, uValue] of Object.entries(uniforms)) {
                const sharedUniform = this.sharedUniforms[uName];
                if (!sharedUniform) continue;

                if (duration > 0) {
                    tl.add(sharedUniform, {
                        value: uValue as any,
                        duration,
                        ease,
                    }, position);
                } else {
                    tl.add({
                        duration: 0,
                        onComplete: () => {
                            if (sharedUniform.value && typeof (sharedUniform.value as any).set === 'function') {
                                (sharedUniform.value as any).set(uValue);
                            } else {
                                sharedUniform.value = uValue;
                            }
                        }
                    }, position);
                }
            }
            return;
        }

        // --- Path B: Node Specific Properties ---
        const node = this.nodes.get(target);
        if (!node) return;

        if (variant) {
            await node.addVariantAnim(tl, variant, duration, ease, position);
        }

        if (visible !== undefined) {
            node.addVisibleAnim(tl, visible, position);
        }

        if (uniforms) {
            for (const [uName, uValue] of Object.entries(uniforms)) {
                node.addUniformAnim(tl, uName, uValue, duration, ease, position);
            }
        }
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
            tint: this.sharedUniforms.uTint.value.getHex(),
            parentName: this.parent?.name
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

        // 恢复挂载关系
        if (state.parentName && state.parentName.startsWith('s_')) {
            const scene = await SceneManager.get(state.parentName);
            if (scene && this.parent !== scene) {
                scene.add(this);
            }
        } else if (!state.parentName && this.parent) {
            this.parent.remove(this);
        }

        renderScheduler.requestRender();
    }
}
