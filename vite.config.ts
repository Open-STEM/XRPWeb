import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin';
import { visualizer } from "rollup-plugin-visualizer";
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { fileURLToPath, URL } from 'url';
import { resolve } from 'path';
import flowbiteReact from "flowbite-react/plugin/vite";

// https://vite.dev/config/
export default defineConfig({
    base: './',
    esbuild: {
        sourcemap: true,
        supported: {
            'top-level-await': true,
        },
    },
    define: {
        rootDirectory: JSON.stringify(__dirname)
    },
    plugins: [react(), visualizer() as PluginOption, viteStaticCopy({
        targets: [
            {
                src: 'node_modules/flexlayout-react/style',
                dest: './node_modules/flexlayout-react/'
            },
            {
                src: 'node_modules/gridstack/dist/gridstack.css',
                dest: './node_modules/gridstack/dist/'
            }        ]
    }), flowbiteReact()],
    resolve: {
        alias: [
            { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
            {
                find: '@components',
                replacement: fileURLToPath(new URL('./src/components', import.meta.url)),
            },
            {
                find: '@connections',
                replacement: fileURLToPath(new URL('./src/connections', import.meta.url)),
            },
            {
                find: '@utils',
                replacement: fileURLToPath(new URL('./src/utils', import.meta.url)),
            },
            {
                find: '@assets',
                replacement: fileURLToPath(new URL('./src/assets', import.meta.url)),
            },
        ],
    },
    worker: {
        format: 'es',
    },
    optimizeDeps: {
        esbuildOptions: {
            tsconfig: './tsconfig.json',
            plugins: [
                importMetaUrlPlugin
            ],
        },
    },
    server: {
        port: 3000,
    },
    build: {
        minify: 'esbuild',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            },
            output: {
                manualChunks(id: string) {
                    if (id.includes('react-blockly')) {
                        return '@react-blockly'
                    }
                    if (id.includes('@codingame')) {
                        return '@codingame'
                    }
                    if (
                        id.includes('react') ||
                        id.includes('flexlayout-react') ||
                        id.includes('react-arborist') ||
                        id.includes('react-dom') ||
                        id.includes('react-hotkeys-hook') ||
                        id.includes('eact-i18next') ||
                        id.includes('react-icons') ||
                        id.includes('react-xtermjs')
                    ) {
                        return '@react'
                    }
                    if (
                        id.includes('monaco-languageclient') ||
                        id.includes('@typefox/pyright-browser') ||
                        id.includes('monaco-editor')
                    ) {
                        return '@monaco'
                    }
                }
            }
        }
    },
    envPrefix: ['VITE_', 'GOOGLE_'],
});