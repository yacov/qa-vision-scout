import '@testing-library/jest-dom';
import { expect, vi } from 'vitest';
import { createDefaultMockFetch } from './__tests__/test-utils';

// Mock Deno environment
const mockDeno = {
  env: {
    get: (key: string) => {
      const envVars: Record<string, string> = {
        BROWSERSTACK_USERNAME: 'test_username',
        BROWSERSTACK_ACCESS_KEY: 'test_access_key',
        SUPABASE_URL: 'http://localhost:54321',
        SUPABASE_ANON_KEY: 'test-anon-key'
      };
      return envVars[key] || undefined;
    },
    set: vi.fn(),
    delete: vi.fn(),
    toObject: vi.fn()
  },
  serve: (handler: (req: Request) => Promise<Response>) => {
    return {
      shutdown: vi.fn(),
      finished: Promise.resolve()
    };
  }
};

// @ts-ignore - mock Deno global
globalThis.Deno = mockDeno;

// Add custom matchers
expect.extend({
  toHaveClass(received, className) {
    const pass = received.classList.contains(className);
    return {
      pass,
      message: () =>
        `expected ${received} ${pass ? 'not to' : 'to'} have class "${className}"`,
    };
  },
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => '12345678-1234-1234-1234-123456789012',
    subtle: {} as any,
    getRandomValues: () => new Uint8Array(10)
  }
});

// Mock fetch globally
global.fetch = createDefaultMockFetch();

// Mock console.error to not pollute test output
console.error = vi.fn();

// Mock btoa globally since it's not available in Node
global.btoa = (str: string) => Buffer.from(str).toString('base64');
global.atob = (str: string) => Buffer.from(str, 'base64').toString(); 