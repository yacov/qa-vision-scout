import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.test file
dotenv.config({
  path: resolve(__dirname, '../../../../.env.test')
});

// Define required environment variables
const requiredEnvVars = [
  'BROWSERSTACK_USERNAME',
  'BROWSERSTACK_ACCESS_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
] as const;

// Type for environment variable names
type RequiredEnvVar = typeof requiredEnvVars[number];

// Custom error for missing environment variables
class MissingEnvVarError extends Error {
  constructor(envVar: RequiredEnvVar) {
    super(`Missing required environment variable: ${envVar}`);
    this.name = 'MissingEnvVarError';
  }
}

// Validate required environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(new MissingEnvVarError(envVar));
    console.error('Please create a .env.test file based on .env.example');
    process.exit(1);
  }
}

// Create mock headers
const mockHeaders = {
  append: jest.fn(),
  delete: jest.fn(),
  get: jest.fn(),
  has: jest.fn(),
  set: jest.fn(),
  forEach: jest.fn(),
  getSetCookie: jest.fn().mockReturnValue([]),
  entries: jest.fn().mockReturnValue([][Symbol.iterator]()),
  keys: jest.fn().mockReturnValue([][Symbol.iterator]()),
  values: jest.fn().mockReturnValue([][Symbol.iterator]()),
  [Symbol.iterator]: jest.fn().mockReturnValue([][Symbol.iterator]())
} as unknown as Headers;

// Mock fetch implementation
const mockFetch = jest.fn().mockImplementation((): Promise<Response> => 
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: mockHeaders,
    redirected: false,
    statusText: 'OK',
    type: 'basic',
    url: 'https://api.example.com',
    body: null,
    bodyUsed: false,
    clone: () => ({} as Response),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData())
  } as Response)
);

// Set up global fetch mock
global.fetch = mockFetch; 