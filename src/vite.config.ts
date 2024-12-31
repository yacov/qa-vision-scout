import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'url';
import path from 'path';

export default defineConfig(({ mode }) => ({
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
    mode === 'development' && {
      name: 'lovable-tagger',
      enforce: 'pre',
      apply: 'serve',
      transform(code, id) {
        if (id.includes('node_modules')) {
          return code;
        }
        // Add your transform logic here
        return code;
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));