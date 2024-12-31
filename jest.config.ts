import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/supabase/functions/browserstack-screenshots'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^node-fetch$': 'node-fetch/lib/index.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch)/)'
  ],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.integration.test.ts'
  ],
  extensionsToTreatAsEsm: ['.ts'],
  testTimeout: 10000,
  maxConcurrency: 1,
  maxWorkers: 1
};

module.exports = config; 