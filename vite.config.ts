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
    }
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react-router-dom'],
        }
      }
    }
  }
}));