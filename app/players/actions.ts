"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin";
import { hasSupabaseEnv } from "@/lib/env";
import { playerLevelValues } from "@/lib/players/levels";
import { createClient } from "@/lib/supabase/server";
import { errorState, fieldErrorsFrom, successState, type FormState } from "@/lib/validation/form-state";

const addPlayerSchema = z.object({
  displayName: z.string().trim().min(1, "Escribe el nombre del jugador.").max(80, "Máximo 80 caracteres."),
  rating: z.coerce
    .number({ message: "Selecciona un nivel." })
    .refine((value) => playerLevelValues.includes(value), "Selecciona un nivel válido."),
});

const playerIdSchema = z.string().uuid();
const updatePlayerSchema = addPlayerSchema.extend({ id: playerIdSchema });

async function requireAdmin(): Promise<{ error: FormState } | { userId: string }> {
  if (!hasSupabaseEnv()) {
    return { error: errorState("Falta configurar Supabase para guardar jugadores.") };
  }
  const admin = await getAdminSession();
  if (!admin.user) return { error: errorState("Tu sesión caducó. Vuelve a entrar.") };
  if (!admin.isAdmin) return { error: errorState("Tu correo no está autorizado para gestionar jugadores.") };
  return { userId: admin.user.id };
}

async function ensureProfile(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("profiles").upsert({
    display_name: user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "Organizador",
    id: userId,
  });
}

export async function addPlayerAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const parsed = addPlayerSchema.safeParse({
    displayName: formData.get("displayName"),
    rating: formData.get("rating"),
  });
  if (!parsed.success) {
    return errorState("Revisa los campos marcados.", fieldErrorsFrom(parsed.error));
  }

  await ensureProfile(guard.userId);
  const supabase = await createClient();
  const { error } = await supabase.from("players").insert({
    display_name: parsed.data.displayName,
    linked_user_id: guard.userId,
    rating: parsed.data.rating,
  });

  if (error) return errorState(`No pudimos guardar el jugador: ${error.message}`);

  revalidatePath("/players");
  return successState(`${parsed.data.displayName} añadido.`);
}

export async function updatePlayerAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const parsed = updatePlayerSchema.safeParse({
    displayName: formData.get("displayName"),
    id: formData.get("id"),
    rating: formData.get("rating"),
  });
  if (!parsed.success) {
    return errorState("Revisa los campos marcados.", fieldErrorsFrom(parsed.error));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .update({
      display_name: parsed.data.displayName,
      rating: parsed.data.rating,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("linked_user_id", guard.userId)
    .select("id");

  if (error) return errorState(`No pudimos actualizar el jugador: ${error.message}`);
  if (!data || data.length === 0) return errorState("Ese jugador ya no está en tu lista.");

  revalidatePath("/players");
  return successState("Jugador actualizado.");
}

export async function deletePlayerAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const parsed = playerIdSchema.safeParse(formData.get("id"));
  if (!parsed.success) return errorState("No pudimos identificar al jugador.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", parsed.data)
    .eq("linked_user_id", guard.userId);

  if (error) return errorState(`No pudimos borrar el jugador: ${error.message}`);

  revalidatePath("/players");
  return successState("Jugador borrado.");
}
