import { vi } from 'vitest';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Make Vitest globals available
declare global {
  interface Window {
    fetch: typeof fetch;
  }
}

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

export { mockFetch };