// Mock Deno.env
export const env = {
  get: vi.fn((key: string) => {
    switch (key) {
      case 'BROWSERSTACK_USERNAME':
        return 'test_user';
      case 'BROWSERSTACK_ACCESS_KEY':
        return 'test_key';
      default:
        return undefined;
    }
  })
};

// Mock serve function from http/server.ts
export const serve = vi.fn((handler: (request: Request) => Promise<Response> | Response) => {
  return Promise.resolve();
});

// Mock corsHeaders from _shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Mock ConnInfo type
export type ConnInfo = {
  remoteAddr: {
    hostname: string;
    port: number;
  };
};

// Mock Handler type
export type Handler = (
  request: Request,
  connInfo: ConnInfo
) => Promise<Response> | Response;

// Re-export Response and Request from global
export const Response = globalThis.Response;
export const Request = globalThis.Request;

// Mock other Deno standard library functions if needed
export const Status = {
  OK: 200,
  BadRequest: 400,
  Unauthorized: 401,
  NotFound: 404,
  InternalServerError: 500,
} as const;

// Mock error handling
export class DenoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DenoError';
  }
}

// Mock HTTP status codes
export const STATUS_TEXT = {
  200: 'OK',
  400: 'Bad Request',
  401: 'Unauthorized',
  404: 'Not Found',
  500: 'Internal Server Error',
} as const; 