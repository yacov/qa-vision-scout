// Import global mocks first
import './test-setup/global-mocks';

import { vi, beforeEach, afterEach, afterAll } from 'vitest';
import { mockFetch } from './test-utils';

// Initialize global test handler
declare global {
  var testHandler: ((req: Request) => Promise<Response>) | undefined;
}

// Replace global fetch with mock
global.fetch = mockFetch.fn as unknown as typeof fetch;

// Import the handler registration after all mocks are in place
import '../index';

// Reset all mocks and ensure handler is registered before each test
beforeEach(() => {
  mockFetch.mockReset();
  vi.clearAllMocks();
  // Re-register handler if needed
  if (!global.testHandler) {
    require('../index');
  }
});

// Clean up after each test
afterEach(() => {
  vi.resetModules();
});

// Clean up after all tests
afterAll(() => {
  vi.restoreAllMocks();
}); 