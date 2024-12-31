import { defineConfig } from 'vitest/config';
import { startVitest } from 'vitest/node';

const config = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  }
});

startVitest('test', [], config); 