"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hasSupabaseEnv } from "@/lib/env";
import { DEMO_ROOM_CODE } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import { errorState, type FormState } from "@/lib/validation/form-state";

const codeSchema = z
  .string()
  .trim()
  .min(3, "El código tiene al menos 3 caracteres.")
  .max(64, "Ese código es demasiado largo.")
  .regex(/^[a-zA-Z0-9-]+$/, "El código solo puede tener letras, números y guiones.");

export async function joinByCodeAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const parsed = codeSchema.safeParse(formData.get("code") ?? "");

  if (!parsed.success) {
    // El aviso va solo junto al campo: repetirlo también arriba lo lee dos veces el lector de pantalla.
    return {
      fieldErrors: { code: parsed.error.issues[0]?.message ?? "Revisa el código." },
      status: "error",
    };
  }

  const code = parsed.data;
  let target: string | null = null;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("resolve_public_code", { p_code: code });

    if (error) {
      return errorState("No pudimos comprobar el código. Inténtalo de nuevo.");
    }

    const resolved = data as { code?: string; kind?: string; slug?: string } | null;
    if (resolved?.kind === "competition" && resolved.code) target = `/r/${resolved.code}`;
    if (resolved?.kind === "club" && resolved.slug) target = `/clubs/${resolved.slug}`;
  } else if (code.toUpperCase() === DEMO_ROOM_CODE) {
    target = `/r/${DEMO_ROOM_CODE}`;
  }

  if (!target) {
    return errorState("No encontramos ninguna sala con ese código.", {
      code: "Revisa el código con quien organiza el evento.",
    });
  }

  redirect(target);
}
