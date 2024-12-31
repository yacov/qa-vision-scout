import type { Mock } from 'vitest';

declare global {
  var fetch: typeof globalThis.fetch;
  
  namespace NodeJS {
    interface Global {
      fetch: typeof globalThis.fetch;
    }
  }
} 