"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const addPlayerSchema = z.object({
  displayName: z.string().min(1, "Escribe el nombre del jugador.").max(80).trim(),
  rating: z.coerce.number().min(0).max(7).optional(),
});

const playerIdSchema = z.string().uuid();
const updatePlayerSchema = addPlayerSchema.extend({
  id: playerIdSchema,
});

export async function addPlayerAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const parsed = addPlayerSchema.safeParse({
    displayName: formData.get("displayName"),
    rating: formData.get("rating") || undefined,
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase.from("profiles").upsert({
    display_name: user.user_metadata.display_name ?? user.email?.split("@")[0] ?? "Organizador",
    id: user.id,
  });

  await supabase.from("players").insert({
    display_name: parsed.data.displayName,
    linked_user_id: user.id,
    rating: parsed.data.rating ?? null,
  });

  revalidatePath("/players");
}

export async function updatePlayerAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const parsed = updatePlayerSchema.safeParse({
    displayName: formData.get("displayName"),
    id: formData.get("id"),
    rating: formData.get("rating") || undefined,
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase
    .from("players")
    .update({
      display_name: parsed.data.displayName,
      rating: parsed.data.rating ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("linked_user_id", user.id);

  revalidatePath("/players");
}

export async function deletePlayerAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const parsed = playerIdSchema.safeParse(formData.get("id"));

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase.from("players").delete().eq("id", parsed.data).eq("linked_user_id", user.id);

  revalidatePath("/players");
}
