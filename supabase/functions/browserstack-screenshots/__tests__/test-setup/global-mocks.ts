import { vi } from 'vitest';

// Mock Deno global object
const mockDeno = {
  serve: vi.fn((handler) => {
    // Store the handler for testing
    (global as any).testHandler = handler;
    return {
      shutdown: vi.fn()
    };
  }),
  env: {
    get: vi.fn((key: string) => {
      switch (key) {
        case 'BROWSERSTACK_USERNAME':
          return 'test_username';
        case 'BROWSERSTACK_ACCESS_KEY':
          return 'test_access_key';
        case 'SUPABASE_URL':
          return 'http://localhost:54321';
        case 'SUPABASE_ANON_KEY':
          return 'test_anon_key';
        default:
          return undefined;
      }
    })
  }
};

// Mock crypto methods
const mockRandomUUID = vi.fn(() => '123e4567-e89b-12d3-a456-426614174000');
const mockGetRandomValues = vi.fn((buffer: ArrayBufferView) => buffer);

// Override crypto methods
Object.defineProperties(globalThis.crypto, {
  randomUUID: {
    configurable: true,
    value: mockRandomUUID
  },
  getRandomValues: {
    configurable: true,
    value: mockGetRandomValues
  }
});

// Set up Deno mock
(global as any).Deno = mockDeno;

// Mock btoa/atob if not available
if (typeof btoa === 'undefined') {
  (global as any).btoa = (str: string) => Buffer.from(str).toString('base64');
}

if (typeof atob === 'undefined') {
  (global as any).atob = (str: string) => Buffer.from(str, 'base64').toString();
}

// Export mocks for test usage
export const mocks = {
  deno: mockDeno,
  randomUUID: mockRandomUUID,
  getRandomValues: mockGetRandomValues
}; 