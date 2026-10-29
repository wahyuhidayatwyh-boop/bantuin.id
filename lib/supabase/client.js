import { createClient } from "@supabase/supabase-js";

if (typeof globalThis !== "undefined" && typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class DummyWebSocket {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    send() {}
    close() {}
  };
}

let _supabaseClient = null;
let _supabaseAdminClient = null;

/**
 * Validates and retrieves the public Supabase client.
 * Strictly uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * NEVER falls back to service role key or dummy keys.
 */
export function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lyyiogratxbijtapeilj.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!anonKey || anonKey.trim() === "" || anonKey.includes("your-") || anonKey.includes("dummy")) {
    throw new Error(
      "[Supabase Configuration Error]: NEXT_PUBLIC_SUPABASE_ANON_KEY belum dikonfigurasi dengan benar di environment variables."
    );
  }

  _supabaseClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
    },
  });

  return _supabaseClient;
}

/**
 * Validates and retrieves the server-only Supabase Admin client.
 * Strictly requires SUPABASE_SERVICE_ROLE_KEY on the server.
 * Strictly prohibited from being accessed on the client (browser).
 */
export function getSupabaseAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "[Security Violation]: supabaseAdmin adalah client server-side dan tidak boleh diakses pada sisi client (browser)."
    );
  }

  if (_supabaseAdminClient) return _supabaseAdminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://lyyiogratxbijtapeilj.supabase.co";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey || serviceKey.trim() === "" || serviceKey.includes("your-") || serviceKey.includes("dummy")) {
    throw new Error(
      "[Supabase Admin Configuration Error]: SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi pada server environment variables."
    );
  }

  _supabaseAdminClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return _supabaseAdminClient;
}

/**
 * Transparent Proxy for public client (maintains `supabase.auth...`, `supabase.from...`, etc.)
 * Defers initialization until property access, preventing Next.js build-time crashes.
 */
export const supabase = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseClient();
    const value = client[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

/**
 * Transparent Proxy for admin client (maintains `supabaseAdmin.storage...`, etc.)
 * Defers initialization until property access and enforces server-only access.
 */
export const supabaseAdmin = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseAdminClient();
    const value = client[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export default supabase;
