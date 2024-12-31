import { beforeEach, vi } from 'vitest';
import { config } from 'dotenv';
import { resolve } from 'path';
import { mockFetch } from './__tests__/test-utils.js';

// Load environment variables from .env.test
const envPath = resolve(__dirname, '.env.test');
const result = config({ path: envPath });

if (result.error) {
  console.warn(`Warning: Error loading environment variables from ${envPath}`);
  console.warn(result.error);
}

// Ensure required environment variables are set
const requiredEnvVars = ['BROWSERSTACK_USERNAME', 'BROWSERSTACK_ACCESS_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.warn('Warning: Missing required environment variables:');
  missingEnvVars.forEach(varName => console.warn(`- ${varName}`));
}

// Mock database client
vi.mock('./database', () => ({
  default: {
    createSupabaseClient: vi.fn().mockReturnValue({})
  }
}));

// Set up global fetch mock
global.fetch = mockFetch.fn;

// Reset mocks before each test
beforeEach(() => {
  vi.resetAllMocks();
  global.fetch = mockFetch.fn;
}); 