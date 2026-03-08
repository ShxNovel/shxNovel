/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
    test: {
        root: 'test',
        clearMocks: true,
        typecheck: {
            enabled: true,
        },
    },
    build: {
        sourcemap: true,
        lib: {
            entry: './src/index.ts',
            name: 'canoe',
            fileName: 'canoe',
            formats: ['es'],
        },
        rollupOptions: {
            external: ['animejs', 'three', /^three(\/.*)?$/, 'stats.js'],
            output: {
                // inlineDynamicImports: false,
                // preserveModules: true,
                // entryFileNames: ({ name: fileName }) => {
                //     return `${fileName}.js`;
                // },
                globals: (id) => {
                    if (id === 'three' || id.startsWith('three/addon')) return 'THREE';
                    if (id === 'animejs') return 'animejs';
                    if (id === 'stats.js') return 'Stats';
                    return '';
                },
            },
        },
    },
});
