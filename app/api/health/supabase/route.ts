import { NextResponse } from "next/server";

import { getSupabaseEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { supabaseUrl } = getSupabaseEnv();
    const healthUrl = new URL("/auth/v1/health", supabaseUrl);
    const startedAt = Date.now();

    const response = await fetch(healthUrl.toString(), {
      cache: "no-store",
    });
    const responseBody = await response.text();

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      elapsedMs: Date.now() - startedAt,
      supabaseHost: healthUrl.host,
      preview: responseBody.slice(0, 200),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
