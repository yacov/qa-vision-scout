declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    toObject(): { [key: string]: string };
  }
  export const env: Env;
}

declare module "deno" {
  export = Deno;
} 