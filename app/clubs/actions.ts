"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { errorState, fieldErrorsFrom, type FormState } from "@/lib/validation/form-state";

const createClubSchema = z.object({
  city: z.string().trim().max(100, "Máximo 100 caracteres.").optional(),
  name: z.string().trim().min(1, "Ponle nombre a la organización.").max(100, "Máximo 100 caracteres."),
});

export async function createClubAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = createClubSchema.safeParse({
    city: formData.get("city") || undefined,
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return errorState("Revisa los campos marcados.", fieldErrorsFrom(parsed.error));
  }

  const admin = await getAdminSession();
  if (!admin.user) return errorState("Tu sesión caducó. Vuelve a entrar.");
  if (!admin.isAdmin) return errorState("Tu correo no está autorizado para crear organizaciones.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorState("Tu sesión caducó. Vuelve a entrar.");

  await supabase.from("profiles").upsert({
    display_name: user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "Organizador",
    id: user.id,
  });

  const slug = createSlug(parsed.data.name);
  const { data: club, error } = await supabase
    .from("clubs")
    .insert({
      city: parsed.data.city ?? null,
      name: parsed.data.name,
      owner_user_id: user.id,
      slug,
      timezone: "America/Caracas",
    })
    .select("id,slug")
    .single();

  if (error) return errorState(`No pudimos crear la organización: ${error.message}`);

  const { error: memberError } = await supabase.from("club_members").insert({
    club_id: club.id,
    role: "owner",
    user_id: user.id,
  });

  if (memberError) {
    return errorState(`La organización se creó pero no pudimos asignarte como propietario: ${memberError.message}`);
  }

  revalidatePath("/clubs");
  redirect(`/clubs/${club.slug}`);
}

function createSlug(name: string) {
  const base =
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 42) || "organizacion";

  return `${base}-${crypto.randomUUID().slice(0, 4)}`;
}
