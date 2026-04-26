"use client";

import { useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useMemo } from "react";
import { Database } from "./database.types";

/**
 * Supabase browser client that sends the Clerk session JWT (Supabase third-party auth).
 */
export function useClerkSupabase() {
  const { session, isLoaded } = useSession();

  const supabase = useMemo(
    () =>
      createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          async accessToken() {
            return session?.getToken() ?? null;
          },
        }
      ),
    [session]
  );

  return { supabase, sessionLoaded: isLoaded };
}
