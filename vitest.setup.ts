import { vi } from 'vitest';
import dotenv from 'dotenv';

dotenv.config();

// Mock fetch globally
const mockFetch = vi.fn<typeof fetch>();
global.fetch = mockFetch;

export { mockFetch }; 