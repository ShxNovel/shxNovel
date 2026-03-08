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
        lib: {
            entry: './src/index.ts',
            name: 'world',
            fileName: 'world',
        },
    },
});
