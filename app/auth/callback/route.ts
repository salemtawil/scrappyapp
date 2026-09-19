import { NextResponse } from "next/server";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // `next` llega del enlace del correo: solo se admiten rutas internas.
  const next = safeInternalPath(url.searchParams.get("next"));

  if (code && hasSupabaseEnv()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/auth/login?error=callback", url.origin));
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
