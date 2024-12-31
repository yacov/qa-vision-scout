/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  moduleNameMapper: {
    '^node-fetch$': '<rootDir>/node_modules/node-fetch/lib/index.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch)/)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleDirectories: ['node_modules', '.'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  watchPathIgnorePatterns: [
    '<rootDir>/../../package.json'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};

module.exports = config; 