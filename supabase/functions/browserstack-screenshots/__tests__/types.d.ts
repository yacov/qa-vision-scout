declare namespace NodeJS {
  interface Global {
    fetch: jest.Mock<Promise<Response>>;
  }
  interface ProcessEnv {
    BROWSERSTACK_USERNAME: string;
    BROWSERSTACK_ACCESS_KEY: string;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
  }
}

interface Response {
  ok: boolean;
  status: number;
  json(): Promise<any>;
  text(): Promise<string>;
  headers: Headers;
  redirected: boolean;
  statusText: string;
  type: ResponseType;
  url: string;
  body: ReadableStream<Uint8Array> | null;
  bodyUsed: boolean;
  clone(): Response;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  formData(): Promise<FormData>;
}

interface Headers {
  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  has(name: string): boolean;
  set(name: string, value: string): void;
  forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any): void;
  getSetCookie(): string[];
  entries(): IterableIterator<[string, string]>;
  keys(): IterableIterator<string>;
  values(): IterableIterator<string>;
  [Symbol.iterator](): IterableIterator<[string, string]>;
}

type ResponseType = "basic" | "cors" | "default" | "error" | "opaque" | "opaqueredirect";

declare namespace jest {
  interface Mock<T = any, Y extends any[] = any[]> {
    (...args: Y): T;
    mockImplementation(fn: (...args: Y) => T): this;
    mockReturnValue(value: T): this;
    mockResolvedValue(value: Awaited<T>): this;
    mockResolvedValueOnce(value: Awaited<T>): this;
    mockRejectedValue(value: unknown): this;
    mockRejectedValueOnce(value: unknown): this;
    mockReset(): void;
  }
}

declare module "dotenv" {
  export function config(options?: { path?: string }): void;
}

declare module "path" {
  export function resolve(...paths: string[]): string;
} 