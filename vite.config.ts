import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin'
import { fileURLToPath, URL } from "url";

// https://vite.dev/config/
export default defineConfig({
  esbuild: {
    sourcemap: true,
    supported: {
      'top-level-await': true
    }
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: '@components', replacement: fileURLToPath(new URL('./src/components', import.meta.url)) },
      { find: '@assets', replacement: fileURLToPath(new URL('./src/assets', import.meta.url)) },
    ]
  },
  worker: {
    format: "es"
  },
  optimizeDeps: {
    esbuildOptions: {
      tsconfig: './tsconfig.json',
      plugins: [importMetaUrlPlugin]
    }
  },
  server: {
    port: 3000
  },
});