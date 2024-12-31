import { jest } from '@jest/globals';

// Mock global fetch
const mockHeaders = new Headers({
  'content-type': 'application/json'
});

const mockResponse = {
  ok: true,
  status: 200,
  headers: mockHeaders,
  json: async () => ({})
};

// @ts-ignore - Ignore type checking for test mock
global.fetch = jest.fn(() => Promise.resolve(mockResponse));

// Mock Deno.env.get
(global as any).Deno = {
  env: {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'BROWSERSTACK_USERNAME':
          return 'test-user';
        case 'BROWSERSTACK_ACCESS_KEY':
          return 'test-key';
        default:
          return undefined;
      }
    })
  }
};

// Mock crypto
(global as any).crypto = {
  randomUUID: jest.fn(() => 'test-uuid')
}; 