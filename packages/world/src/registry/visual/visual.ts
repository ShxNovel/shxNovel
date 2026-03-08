import {
    VisualIR, VisualNodeIR, VisualNodeVariantIR,
    ShaderHandle, TextureHandle,
    UniformValue
} from "@shxnovel/schema";
import { VisualRegistry } from './registry';

type VisualNodesSpec = {
    [nodeName: string]: {
        parent?: string | 'root';

        variants: {
            [variantName: string]:
            | undefined
            | TextureHandle<any>
            | {
                use: TextureHandle<any>;
                size?: [number, number];
            };
        };

        pos?: [number, number, number?];
        size?: [number, number];

        uniforms?: Record<string, UniformValue>;
        vertexShader?: ShaderHandle<any>;
        fragmentShader?: ShaderHandle<any>;
    };
};

export function regVisual(name: string) {
    if (name.length === 0) {
        throw new Error('Visual name cannot be empty');
    }

    const Ex_name: VisualIR['name'] = `v_${name}`;

    const result: VisualIR = {
        name: Ex_name,
        type: 'visual',
        nodes: {},
        exprs: {
            "0#self": {
                target: 'self',
                uniforms: { uGroupAlpha: 0, },
            },
            "1#self": {
                target: 'self',
                uniforms: { uGroupAlpha: 1, },
            }
        },
    };

    VisualRegistry.reg(Ex_name, result);

    function nodes<N extends VisualNodesSpec>(nodes: N) {
        for (const nodeName in nodes) {
            const element = nodes[nodeName];
            const one = solveNode(element);
            result.nodes[nodeName as string] = one;

            // add auto expr

            for (const variantName in one.variants) {
                result.exprs[`${nodeName}:${variantName}`] = {
                    target: nodeName,
                    variant: variantName,
                };
            }

            result.exprs[`v#${nodeName}`] = {
                target: nodeName,
                visible: true,
            };
            result.exprs[`u#${nodeName}`] = {
                target: nodeName,
                visible: false,
            };

            result.exprs[`1#${nodeName}`] = {
                target: nodeName,
                uniforms: { uBaseAlpha: 1, },
            };
            result.exprs[`0#${nodeName}`] = {
                target: nodeName,
                uniforms: { uBaseAlpha: 0, },
            };
        }
    }

    function solveNode(node: VisualNodesSpec[string]): VisualNodeIR {
        let parent = node.parent ?? 'root';

        let pos = node.pos ?? [0, 0, 0];
        let size = node.size ?? undefined;

        let uniforms: Record<string, UniformValue> = node.uniforms ??
        {
            uBaseAlpha: { type: 'number', value: 1 },
        };

        let vertexShader = node.vertexShader?.name
            ?? 'sh_autoVertex' as ShaderHandle['name'];

        let fragmentShader = node.fragmentShader?.name
            ?? 'sh_autoFragment' as ShaderHandle['name'];

        const variants: VisualNodeIR['variants'] = {};

        for (const key in node.variants) {
            const element = node.variants[key];
            const res = solveNodeVariants(element);
            if (res) variants[key] = res;
        }

        const output = {
            parent,
            variants,
            pos,
            size,
            uniforms,
            vertexShader,
            fragmentShader
        };

        return output;
    }

    function solveNodeVariants(
        variant: VisualNodesSpec[string]['variants'][string]
    ): undefined | VisualNodeVariantIR {
        let output: VisualNodeVariantIR;

        if (!variant) return undefined;

        if ('type' in variant) {
            // only handle
            output = { use: variant };
        } else if ('use' in variant) {
            // full
            output = variant;
        } else {
            throw new Error('Invalid variant');
        }

        return output;
    }

    return { nodes };
}
