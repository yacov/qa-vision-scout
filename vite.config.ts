import { defineConfig, type ConfigEnv, type UserConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }: ConfigEnv): UserConfig => ({
  server: {
    host: "::",
    port: 8080,
    open: true,
    hmr: {
      overlay: true
    }
  },
  plugins: [
    react({
      plugins: mode === 'development' ? [] : [['swc-plugin-coverage-instrument', {}]]
    }),
    mode === 'development' && {
      ...componentTagger(),
      enforce: 'pre' as const
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@styles": path.resolve(__dirname, "./src/styles"),
      "@utils": path.resolve(__dirname, "./src/utils")
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    minify: mode === 'production',
    rollupOptions: {
      external: [],
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('@radix-ui')) return 'vendor-radix';
            if (id.includes('react')) return 'vendor-react';
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
    assetsInlineLimit: 4096
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@radix-ui/react-dialog',
      '@radix-ui/react-icons',
      '@hookform/resolvers',
      'react-hook-form',
      'zod'
    ],
    exclude: ['@supabase/supabase-js']
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
}));