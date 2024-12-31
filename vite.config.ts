import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from "lovable-tagger";
import type { PluginOption } from 'vite';

export default defineConfig(({ mode }) => ({
  server: {
    port: 8080,
    host: true,
    open: true,
    hmr: {
      overlay: true,
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
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
}));