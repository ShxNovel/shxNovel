import { AssetList } from '.';

export function generateDeclaration(assetList: AssetList): string {
    const formatType = (files: string[]): string => {
        if (files.length === 0) return ' ';
        return files.map((f) => `        '${f}': never;`).join('\n');
    };

    const sections: string[] = [];

    if (assetList.texture.length > 0) {
        sections.push(`    namespace Texture {\n      interface Key {\n${formatType(assetList.texture)}\n      }\n    }`);
    } else {
        sections.push(`    namespace Texture {\n      interface Key { }\n    }`);
    }

    if (assetList.audio.length > 0) {
        sections.push(`    namespace Audio {\n      interface Key {\n${formatType(assetList.audio)}\n      }\n    }`);
    } else {
        sections.push(`    namespace Audio {\n      interface Key { }\n    }`);
    }

    return `import '@shxnovel/schema';\n\ndeclare module "@shxnovel/schema" {\n  namespace Assets {\n\n${sections.join('\n\n')}\n\n  }\n}\n`;
}
