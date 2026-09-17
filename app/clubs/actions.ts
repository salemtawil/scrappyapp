"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

const createClubSchema = z.object({
  city: z.string().max(100).optional(),
  name: z.string().min(1).max(100).trim(),
});

export async function createClubAction(formData: FormData) {
  const parsed = createClubSchema.safeParse({
    city: formData.get("city") || undefined,
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return;
  }

  const admin = await getAdminSession();
  if (!admin.user) redirect("/auth/login?next=/clubs");
  if (!admin.isAdmin) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/clubs");
  }

  await supabase.from("profiles").upsert({
    display_name: user.user_metadata.display_name ?? user.email?.split("@")[0] ?? "Organizador",
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

  if (error) {
    throw new Error(`No pudimos crear la organizacion: ${error.message}`);
  }

  await supabase.from("club_members").insert({
    club_id: club.id,
    role: "owner",
    user_id: user.id,
  });

  revalidatePath("/clubs");
  redirect(`/clubs/${club.slug}`);
}

function createSlug(name: string) {
  const base =
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 42) || "organizacion";

  return `${base}-${crypto.randomUUID().slice(0, 4)}`;
}
