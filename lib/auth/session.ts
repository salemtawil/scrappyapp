import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  if (!hasSupabaseEnv()) {
    return { configured: false, user: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { configured: true, user };
}
