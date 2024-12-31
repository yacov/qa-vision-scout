import { vi } from 'vitest';
import dotenv from 'dotenv';

dotenv.config();

// Mock fetch globally
const mockFetch = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
global.fetch = mockFetch;

export { mockFetch }; 