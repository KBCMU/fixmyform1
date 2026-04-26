/**
 * Server-side Supabase client (Clerk session token → Supabase third-party auth).
 * Use in Route Handlers, Server Actions, and Server Components that run in a request context.
 */

import { auth } from "@clerk/nextjs/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

export async function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      async accessToken() {
        return (await auth()).getToken();
      },
    }
  );
}
