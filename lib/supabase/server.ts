import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import {
  getSupabaseEnv,
  getSupabaseServiceRoleEnv,
  hasSupabaseServiceRoleKey,
} from "@/lib/supabase/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // In server components, setting cookies may be unavailable.
        }
      },
    },
  });
}

export function createSupabaseAdminClient() {
  const { supabaseUrl, supabaseKey } = getSupabaseServiceRoleEnv();

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function createSupabaseDataClient() {
  if (hasSupabaseServiceRoleKey()) {
    return createSupabaseAdminClient();
  }

  return createSupabaseServerClient();
}
