import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import type { Plugin, PluginOption } from 'vite';

interface DevPlugin extends Plugin {
  enforce: 'pre' | 'post';
  apply: 'build' | 'serve';
  transform: (code: string, id: string) => string;
}

export default defineConfig(({ mode }) => {
  const devPlugin: DevPlugin = {
    name: 'lovable-tagger',
    enforce: 'pre',
    apply: 'serve',
    transform(code: string, id: string) {
      if (id.includes('node_modules')) {
        return code;
      }
      return code;
    },
  };

  return {
    server: {
      host: '0.0.0.0',
      port: 8080,
      open: true,
      hmr: {
        overlay: true,
      },
    },
    plugins: [
      react(),
      mode === 'development' && devPlugin,
    ].filter(Boolean) as PluginOption[],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        external: ['react-router-dom'],
        output: {
          globals: {
            'react-router-dom': 'ReactRouterDOM'
          },
          manualChunks: {
            'vendor-radix': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-toast',
              '@radix-ui/react-collapsible',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-radio-group',
              '@radix-ui/react-label',
              '@radix-ui/react-slot'
            ],
            'vendor-form': [
              '@hookform/resolvers',
              'react-hook-form',
              'zod'
            ],
            'vendor-ui': [
              'class-variance-authority',
              'tailwind-merge',
              'lucide-react'
            ]
          }
        }
      },
      sourcemap: mode === 'development'
    }
  };
});