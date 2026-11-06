import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(currentDirectory, '../..');

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, repositoryRoot, '');
  const apiTarget = environment.VITE_API_URL || 'http://localhost:4000';

  return {
    envDir: repositoryRoot,
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 4173,
      strictPort: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(moduleId) {
            if (
              moduleId.includes('/node_modules/react/') ||
              moduleId.includes('/node_modules/react-dom/') ||
              moduleId.includes('/node_modules/scheduler/')
            ) {
              return 'react-vendor';
            }

            if (
              moduleId.includes('/node_modules/@tanstack/') ||
              moduleId.includes('/node_modules/react-router')
            ) {
              return 'data-vendor';
            }

            return undefined;
          },
        },
      },
    },
  };
});
