declare namespace NodeJS {
  interface Global {
    fetch: typeof fetch;
  }
  interface ProcessEnv {
    BROWSERSTACK_USERNAME: string;
    BROWSERSTACK_ACCESS_KEY: string;
  }
}

interface Response {
  ok: boolean;
  status?: number;
  json(): Promise<any>;
  text(): Promise<string>;
}

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