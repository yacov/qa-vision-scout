/// <reference types="https://deno.land/x/types/index.d.ts" />

declare module "https://esm.sh/@supabase/supabase-js@2.39.3" {
  export * from "@supabase/supabase-js";
}

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response>): void;
}

declare module "@supabase/supabase-js" {
  export interface SupabaseClient {
    from: (table: string) => any;
  }

  export function createClient(url: string, key: string): SupabaseClient;
}

declare interface Request {
  method: string;
  headers: Headers;
  json(): Promise<any>;
}

declare interface Response {
  ok: boolean;
  status?: number;
  json(): Promise<any>;
  text(): Promise<string>;
}

declare interface Headers {
  get(name: string): string | null;
}

declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}