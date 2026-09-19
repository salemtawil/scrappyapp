import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export interface ActivityEntry {
  action: string;
  createdAt: string;
  id: string;
}

/** Registro de auditoría de una competición. RLS lo limita a su organizador. */
export async function getActivityLog(competitionId: string, limit = 30): Promise<ActivityEntry[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id,action,created_at")
    .eq("competition_id", competitionId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];

  return ((data ?? []) as Array<{ action: string; created_at: string; id: string }>).map((row) => ({
    action: row.action,
    createdAt: row.created_at,
    id: row.id,
  }));
}
