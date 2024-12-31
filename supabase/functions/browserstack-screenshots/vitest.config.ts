/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        'test/**',
        '**/__tests__/**'
      ]
    },
    testTimeout: 60000,
    hookTimeout: 60000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
}); 