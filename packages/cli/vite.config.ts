/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { builtinModules } from 'module';

export default defineConfig({
    test: {
        root: 'test',
        clearMocks: true,
        typecheck: {
            enabled: true,
        },
    },
    build: {
        target: 'node18',
        lib: {
            entry: {
                bin: './bin.js',
                cli: './src/index.ts',
            },
            name: 'cli',
            // fileName: (format, entryName) => `${entryName}.js`,
            formats: ['es'],
        },

        rollupOptions: {
            output: {
                manualChunks: {
                    chalk: ['chalk'],
                    commander: ['commander'],
                    ora: ['ora'],
                },
            },
            external: [
                'tsx',
                'json-to-ts',
                '@shxnovel/rewrite',
                ...builtinModules,
                ...builtinModules.map((m) => `node:${m}`),
            ],
        },
    },
});
