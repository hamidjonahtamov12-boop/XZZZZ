import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

import { normalizeLang } from "@/app/i18n";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const nextPath = requestUrl.searchParams.get("next") || "/";
  const lang = normalizeLang(requestUrl.searchParams.get("lang") ?? undefined);
  const safeNextPath = nextPath.startsWith("/") ? nextPath : "/";
  const successUrl = new URL(safeNextPath, requestUrl.origin);
  successUrl.searchParams.set("lang", lang);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    const missingCodeUrl = new URL("/", requestUrl.origin);
    missingCodeUrl.searchParams.set("lang", lang);
    missingCodeUrl.searchParams.set("error", "OAuth code is missing.");
    return NextResponse.redirect(missingCodeUrl);
  }

  const response = NextResponse.redirect(successUrl);
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const errorUrl = new URL("/", requestUrl.origin);
    errorUrl.searchParams.set("lang", lang);
    errorUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(errorUrl);
  }

  return response;
}
