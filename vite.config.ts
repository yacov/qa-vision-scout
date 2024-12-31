import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'url';
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true,
    hmr: {
      overlay: true,
    },
  },
  plugins: [
    react(),
    {
      ...componentTagger(),
      enforce: 'pre',
      apply: 'serve',
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}));