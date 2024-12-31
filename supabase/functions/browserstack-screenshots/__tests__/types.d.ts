declare namespace NodeJS {
  interface Global {
    fetch: import('vitest').Mock;
  }
  interface ProcessEnv {
    BROWSERSTACK_USERNAME: string;
    BROWSERSTACK_ACCESS_KEY: string;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
  }
}

declare module "dotenv" {
  export function config(options?: { path?: string }): void;
}

declare module "path" {
  export function resolve(...paths: string[]): string;
} 