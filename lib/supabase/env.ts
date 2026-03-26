function getSupabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function assertValidServiceRoleKey(value: string) {
  if (value.startsWith("sb_publishable")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is invalid. You set a publishable key. Use the service_role (secret) key from Supabase Dashboard -> Project Settings -> API."
    );
  }
}

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && getSupabasePublicKey());
}

export function hasSupabaseServiceRoleKey() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = getSupabasePublicKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY in .env.local."
    );
  }

  return { supabaseUrl, supabaseKey };
}

export function getSupabaseServerEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? getSupabasePublicKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase server environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (recommended) in .env.local."
    );
  }

  if (
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    assertValidServiceRoleKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  }

  return { supabaseUrl, supabaseKey };
}

export function getSupabaseServiceRoleEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local. Add it to use server-side data access."
    );
  }

  assertValidServiceRoleKey(supabaseKey);

  return { supabaseUrl, supabaseKey };
}
