/// <reference types="vitest" />

export default {
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    testTimeout: 30000,
    hookTimeout: 30000
  }
};