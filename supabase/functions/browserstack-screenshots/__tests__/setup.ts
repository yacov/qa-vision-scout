import { vi, beforeEach, afterAll } from 'vitest';
import { mockFetch } from './test-utils';

// Mock Deno global object
const mockDeno = {
  serve: vi.fn((handler) => {
    // Store the handler for testing
    mockDeno._handler = handler;
    return {
      shutdown: vi.fn()
    };
  }),
  env: {
    get: vi.fn((key: string) => {
      switch (key) {
        case 'BROWSERSTACK_USERNAME':
          return 'iakovvolfkovich_F75ojQ';
        case 'BROWSERSTACK_ACCESS_KEY':
          return 'HYAZ4DUHsvFrouzKZqyj';
        default:
          return undefined;
      }
    })
  },
  // Store the handler for testing
  _handler: null as ((req: Request) => Promise<Response>) | null
};

// @ts-ignore: mock Deno global
global.Deno = mockDeno;

// Mock btoa if not available in test environment
if (typeof btoa === 'undefined') {
  global.btoa = (str: string) => Buffer.from(str).toString('base64');
}

// Mock atob if not available in test environment
if (typeof atob === 'undefined') {
  global.atob = (str: string) => Buffer.from(str, 'base64').toString();
}

// Replace global fetch with mock
global.fetch = mockFetch.fn as unknown as typeof fetch;

// Reset all mocks before each test
beforeEach(() => {
  mockFetch.mockReset();
});

// Clean up after all tests
afterAll(() => {
  vi.restoreAllMocks();
}); 