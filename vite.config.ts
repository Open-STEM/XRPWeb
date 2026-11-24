import { readFile } from 'fs/promises';
import { defineConfig, type PluginOption, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin';
import { visualizer } from "rollup-plugin-visualizer";
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'url';
import { extname, join, normalize, resolve } from 'path';

const MIME_BY_EXT: Record<string, string> = {
    '.json': 'application/json',
    '.js': 'text/javascript',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.uf2': 'application/octet-stream',
    '.txt': 'text/plain',
    '.zip': 'application/zip',
};

/** In dev, firmware-loader fetches use /public/... — mirror the public folder there. */
function devPublicPrefixPlugin(): PluginOption {
    return {
        name: 'dev-public-prefix',
        apply: 'serve',
        configureServer(server) {
            const publicRoot = resolve(__dirname, 'public');
            server.middlewares.use(async (req, res, next) => {
                const url = req.url ?? '';
                if (!url.startsWith('/public/')) {
                    return next();
                }
                const rel = decodeURIComponent(url.slice('/public/'.length).split('?')[0] ?? '');
                const file = normalize(join(publicRoot, rel));
                if (!file.startsWith(publicRoot)) {
                    return next();
                }
                try {
                    const data = await readFile(file);
                    const ext = extname(file).toLowerCase();
                    res.setHeader('Content-Type', MIME_BY_EXT[ext] ?? 'application/octet-stream');
                    res.end(data);
                } catch {
                    next();
                }
            });
        },
    };
}

/**
 * vite-plugin-pwa always links the web manifest from index.html. Drop that
 * link so browsers only offer to install the app once the offline version has
 * been downloaded - src/utils/offline-mode.ts adds it back at runtime.
 */
function stripManifestLinkPlugin(): PluginOption {
    return {
        name: 'strip-manifest-link',
        apply: 'build',
        enforce: 'post',
        transformIndexHtml: {
            order: 'post',
            handler: (html) => html.replace(/<link rel="manifest"[^>]*>/, ''),
        },
    };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const isDev = mode === 'development';
    return {
        base: './',
        esbuild: {
            sourcemap: true,
            supported: {
                'top-level-await': true,
            },
        },
        define: {
            rootDirectory: JSON.stringify(__dirname),
            global: 'globalThis',
        },
        plugins: [
            react(),
            ...(isDev ? [devPublicPrefixPlugin()] : []),
            visualizer() as PluginOption, viteStaticCopy({
            targets: [
                {
                    src: 'node_modules/flexlayout-react/style',
                    dest: './node_modules/flexlayout-react/'
                },
                {
                    src: 'node_modules/gridstack/dist/gridstack.css',
                    dest: './node_modules/gridstack/dist/'
                },
                {
                    // Blockly's sprites (trashcan, zoom controls), sounds and
                    // cursors - served locally instead of blockly-demo.appspot.com.
                    src: 'node_modules/blockly/media/*',
                    dest: './blockly-media/'
                }        ]
        }),
            // Offline support: precache the whole build (app, Monaco/Pyright,
            // firmware-loader UF2s, XRPLib, drivers) so the IDE, firmware
            // updates and library installs work with no network after the
            // first visit. Updates wait for the user to reload so a new
            // version never interrupts unsaved work.
            VitePWA({
                registerType: 'prompt',
                injectRegister: false,
                manifest: {
                    name: 'XRP Web App',
                    short_name: 'XRPWeb',
                    description: 'XRP Web Development Environment',
                    start_url: './',
                    scope: './',
                    display: 'standalone',
                    background_color: '#ffffff',
                    theme_color: '#005a9e',
                    icons: [
                        { src: 'pwa/icon-192.png', sizes: '192x192', type: 'image/png' },
                        { src: 'pwa/icon-512.png', sizes: '512x512', type: 'image/png' },
                        {
                            src: 'pwa/maskable-512.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'maskable',
                        },
                    ],
                },
                workbox: {
                    globPatterns: ['**/*'],
                    globIgnores: ['**/*.map'],
                    // The Monaco chunk alone is ~13 MB.
                    maximumFileSizeToCacheInBytes: 32 * 1024 * 1024,
                    navigateFallback: 'index.html',
                    navigateFallbackDenylist: [/^\/api\//],
                    cleanupOutdatedCaches: true,
                },
            }),
            stripManifestLinkPlugin(),
        ],
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
            include: ['vscode-textmate', 'vscode-oniguruma'],
            esbuildOptions: {
                tsconfig: './tsconfig.json',
                plugins: [
                    importMetaUrlPlugin
                ],
            },
        },
        server: {
            port: 3000,
            proxy: {
                '/api': env.GOOGLE_CHATAPI_PROXY_TARGET
            }
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
                        if (
                            id.includes('@codingame') ||
                            id.includes('monaco-languageclient') ||
                            id.includes('@typefox/pyright-browser') ||
                            id.includes('monaco-editor') ||
                            id.includes('vscode')
                        ) {
                            return '@monaco'
                        }
                        if (
                            id.includes('react') ||
                            id.includes('flexlayout-react') ||
                            id.includes('react-arborist') ||
                            id.includes('react-dom') ||
                            id.includes('react-hotkeys-hook') ||
                            id.includes('react-i18next') ||
                            id.includes('react-icons') ||
                            id.includes('react-xtermjs')
                        ) {
                            return '@react'
                        }
                    }
                }
            }
        },
        envPrefix: ['VITE_', 'GOOGLE_'],
    }
});