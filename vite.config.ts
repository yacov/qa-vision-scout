import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import type { PluginOption } from 'vite';

interface DevPlugin extends PluginOption {
  name: string;
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
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        external: ['react-router-dom'],
        output: {
          globals: {
            'react-router-dom': 'ReactRouterDOM'
          }
        }
      }
    }
  };
});