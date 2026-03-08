import { VisualIR } from "@shxnovel/schema";

export class VisualRegistry {
    static pool = new Map<string, VisualIR>();

    static reg(name: string, visual: VisualIR) {
        if (name.length === 0) {
            throw new Error('Visual name cannot be empty');
        }
        if (this.pool.has(name)) {
            throw new Error(`Visual ${name} already registered`);
        }
        this.pool.set(name, visual);
    }

    static finish() {
        // [once] clear finish
        VisualRegistry.finish = () => {
            return this.pool;
        };

        this.pool.forEach((item, _name) => {
            const { nodes, exprs } = item;

            const expressionMap = {} as Record<string, any>;
            Object.entries(nodes).forEach(([nodeName, node]) => {
                const { variants } = node;

                if (!variants) return;

                // ping-pong
                Object.entries(variants).forEach(([variantName, _variant]) => {
                    {
                        const key = `${nodeName}:${variantName}`;
                        const value = { target: nodeName, variant: variantName };
                        expressionMap[key] = value;
                    }
                });

                // visible
                {
                    const key = `v#${nodeName}`;
                    const value = { target: nodeName, visible: true };
                    expressionMap[key] = value;
                }
                {
                    const key = `u#${nodeName}`;
                    const value = { target: nodeName, visible: false };
                    expressionMap[key] = value;
                }

                // opacity
                {
                    const key = `1#${nodeName}`;
                    const value = {
                        target: nodeName,
                        uniforms: {
                            uBaseAlpha: 1,
                        },
                    };
                    expressionMap[key] = value;
                }
                {
                    const key = `0#${nodeName}`;
                    const value = {
                        target: nodeName,
                        uniforms: {
                            uBaseAlpha: 0,
                        },
                    };
                    expressionMap[key] = value;
                }
            });

            // self opacity
            {
                const key = `1#self`;
                const value = {
                    target: 'self',
                    uniforms: {
                        uGroupAlpha: 1,
                    },
                };
                expressionMap[key] = value;
            }
            {
                const key = `0#self`;
                const value = {
                    target: 'self',
                    uniforms: {
                        uGroupAlpha: 0,
                    },
                };
                expressionMap[key] = value;
            }

            const common = getCommonProperties(expressionMap, exprs);
            if (common.length) {
                console.warn(`Conflict with auto expression: ${JSON.stringify(common)}`);
            }

            const mergedExprs = { ...expressionMap, ...exprs };
            item.exprs = mergedExprs;
        });

        return this.pool;
    }
}

function getCommonProperties(obj1: Record<string, any>, obj2: Record<string, any>): string[] {
    return Object.keys(obj1).filter((key) => obj2.hasOwnProperty(key));
}
