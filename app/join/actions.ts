"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const codeSchema = z.string().min(3).max(20).trim();

export async function joinByCodeAction(formData: FormData) {
  const parsed = codeSchema.safeParse(formData.get("code"));

  if (!parsed.success) {
    return;
  }

  const code = parsed.data;
  const normalized = code.toLowerCase();

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data: competition } = await supabase
      .from("competitions")
      .select("public_room_code")
      .eq("public_room_code", code)
      .maybeSingle();

    if (competition?.public_room_code) {
      redirect(`/r/${competition.public_room_code}`);
    }

    const { data: club } = await supabase.from("clubs").select("slug").eq("slug", normalized).maybeSingle();

    if (club?.slug) {
      redirect(`/clubs/${club.slug}`);
    }
  }

  redirect(`/r/${code.toUpperCase()}`);
}
