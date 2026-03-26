const SUPABASE_URL_ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"] as const;
const SUPABASE_PUBLIC_KEY_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_DEFAULT_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
] as const;

function readFirstEnv(keys: readonly string[]) {
  for (const key of keys) {
    const value = process.env[key];

    if (value && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function getSupabaseUrl() {
  return readFirstEnv(SUPABASE_URL_ENV_KEYS);
}

function getSupabasePublicKey() {
  return readFirstEnv(SUPABASE_PUBLIC_KEY_ENV_KEYS);
}

function assertValidServiceRoleKey(value: string) {
  if (value.startsWith("sb_publishable")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is invalid. You set a publishable key. Use the service_role (secret) key from Supabase Dashboard -> Project Settings -> API."
    );
  }
}

export function hasSupabaseEnv() {
  return Boolean(getSupabaseUrl() && getSupabasePublicKey());
}

export function hasSupabaseServiceRoleKey() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseEnv() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabasePublicKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and NEXT_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your environment."
    );
  }

  return { supabaseUrl, supabaseKey };
}

export function getSupabaseServerEnv() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? getSupabasePublicKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase server environment variables. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (recommended) in your environment."
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
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY in your environment. Add it to use server-side data access."
    );
  }

  assertValidServiceRoleKey(supabaseKey);

  return { supabaseUrl, supabaseKey };
}
