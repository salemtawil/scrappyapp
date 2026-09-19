"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  message?: string;
  success?: boolean;
};

const loginSchema = z.object({
  email: z.string().email("Escribe un correo valido.").trim().toLowerCase(),
  next: z.string().optional(),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres."),
});

const signUpSchema = loginSchema.extend({
  displayName: z.string().min(1, "Escribe tu nombre visible.").max(100).trim(),
});

export async function signInAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!hasSupabaseEnv()) {
    return { message: "Falta configurar Supabase en Vercel y en tu entorno local." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Revisa los datos del formulario." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { message: "No pudimos iniciar sesion con esas credenciales." };
  }

  revalidatePath("/", "layout");
  redirect(safeInternalPath(parsed.data.next));
}

export async function signUpAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!hasSupabaseEnv()) {
    return { message: "Falta configurar Supabase en Vercel y en tu entorno local." };
  }

  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    next: formData.get("next"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Revisa los datos del formulario." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName,
      },
    },
  });

  if (error) {
    return { message: "No pudimos crear la cuenta. Revisa el correo o intenta con otra contrasena." };
  }

  if (!data.session) {
    return {
      message: "Cuenta creada. Revisa tu correo para confirmar el acceso.",
      success: true,
    };
  }

  revalidatePath("/", "layout");
  redirect(safeInternalPath(parsed.data.next));
}

export async function signOutAction() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/");
}
