import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && (async () => {
      const { componentTagger } = await import('lovable-tagger');
      return componentTagger();
    })(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  },
  optimizeDeps: {
    exclude: ['lovable-tagger']
  },
  build: {
    rollupOptions: {
      external: ['react/jsx-runtime']
    }
  }
}));