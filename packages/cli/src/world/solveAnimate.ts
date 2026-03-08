import { VisualIR } from '@shxnovel/schema';
import JsonToTs from 'json-to-ts';
import { libImport } from '../tools';

const { registry } = (await libImport('@shxnovel/world')).default as typeof import('@shxnovel/world');

export function solveDeclare(): string {
    const VisualSections = solveVisual(registry.VisualRegistry.finish());
    const SceneSections = solveScene(registry.SceneRegistry.finish());
    const RTSections = solveRT(registry.RTRegistry.finish());
    const CameraSections = solveCamera(registry.CameraRegistry.finish());
    const PipelineSections = solvePipeline(registry.PipelineRegistry.finish());

    const gameDataSections = solveData(registry.InGameData, registry.GlobalData);

    return (
        `import '@shxnovel/schema';\n\n` +
        `declare module "@shxnovel/schema" {\n\n` +
        `  namespace Animate {\n` +
        `    interface VisualMap {\n` +
        `${VisualSections.join('\n')}\n` +
        `    }\n\n` +
        `    interface SceneMap {\n` +
        `${SceneSections.join('\n')}\n` +
        `    }\n\n` +
        `    interface CameraMap {\n` +
        `${CameraSections.join('\n')}\n` +
        `    }\n\n` +
        `    interface RTMap {\n` +
        `${RTSections.join('\n')}\n` +
        `    }\n\n` +
        `    interface PipelineMap {\n` +
        `${PipelineSections.join('\n')}\n` +
        `    }\n\n` +
        `  }\n\n` +
        `  namespace GameData {\n` +
        `${gameDataSections.join('\n\n')}\n` +
        `  }\n` +
        `}\n`
    );
}

function solvePipeline(context: ReturnType<typeof registry.PipelineRegistry.finish>) {
    const sections: string[] = [];

    context.forEach((_item, name) => {
        sections.push(`      "${name}": any;`);
    });

    return sections;
}

function solveCamera(context: ReturnType<typeof registry.CameraRegistry.finish>) {
    const sections: string[] = [];

    context.forEach((_item, name) => {
        let flag = 'any';

        if (_item.kind === 'orthographic') flag = 'o';
        else if (_item.kind === 'perspective') flag = 'p';

        sections.push(`      "${name}": "${flag}";`);
    });

    return sections;
}

function solveScene(context: ReturnType<typeof registry.SceneRegistry.finish>) {
    const sections: string[] = [];

    context.forEach((_item, name) => {
        sections.push(`      "${name}": any;`);
    });

    return sections;
}

function solveRT(context: ReturnType<typeof registry.RTRegistry.finish>) {
    const sections: string[] = [];

    context.forEach((_item, name) => {
        sections.push(`      "${name}": any;`);
    });

    return sections;
}

function solveVisual(context: Map<string, VisualIR>) {
    const formatType = (item: VisualIR): string => {
        // const poseKeys = Object.keys(item.poses || {});
        const poseKeys = Object.keys({});
        const exprKeys = Object.keys(item.exprs || {});

        const PoseUnionType = poseKeys.length === 0 ? 'never' : poseKeys.map((k) => `'${k}'`).join(' | ');
        const ExprUnionType = exprKeys.length === 0 ? 'never' : exprKeys.map((k) => `'${k}'`).join(' | ');

        return (
            `      '${item.name}': {\n` +
            `        pose: ${PoseUnionType};\n` +
            `        expr: ${ExprUnionType};\n` +
            `      };\n`
        );
    };
    const sections: string[] = [];

    context.forEach((item, _name) => {
        sections.push(`${formatType(item)}`);
    });

    return sections;
}

function solveData(inGame: Record<string, any>, global: Record<string, any>) {
    const sections: string[] = [];

    const inGameDefinitions = JsonToTs(inGame, { rootName: `InGame` });
    const globalDefinitions = JsonToTs(global, { rootName: `Global` });

    sections.push(...inGameDefinitions);
    sections.push(...globalDefinitions);

    sections.forEach((line, index) => {
        if (line.trim() !== '') {
            sections[index] = '    ' + line.replace(/\n/g, '\n    ');
        }
    });

    return sections;
}
