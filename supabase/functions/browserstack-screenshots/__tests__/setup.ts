import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.test file
dotenv.config({
  path: resolve(__dirname, '../../../../.env.test')
});

// Validate required environment variables
const requiredEnvVars = ['BROWSERSTACK_USERNAME', 'BROWSERSTACK_ACCESS_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    console.error('Please create a .env.test file based on .env.example');
    process.exit(1);
  }
}

// Mock fetch globally
const mockFetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('')
  })
);

global.fetch = mockFetch; 