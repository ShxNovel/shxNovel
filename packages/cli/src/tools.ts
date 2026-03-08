import { pathToFileURL } from 'url';
import { createRequire } from 'module';

export async function fileImport(path: string) {
    return await import(pathToFileURL(path).href);
}

export async function libImport(name: string): Promise<any> {
    return await fileImport(
        createRequire(import.meta.url) // sync with user runtime
            .resolve(name)
    );
}
