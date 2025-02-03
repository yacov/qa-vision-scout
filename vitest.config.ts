/// <reference types="vitest" />

export default {
  test: {
    globals: true,
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000
  }
};