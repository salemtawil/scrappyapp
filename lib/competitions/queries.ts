import { getCurrentUser } from "@/lib/auth/session";
import { demoCompetition } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";
import type {
  CompetitionCategory,
  CompetitionFormat,
  CompetitionStatus,
  CompetitionSummary,
  Visibility,
} from "@/lib/competitions/types";

type CompetitionRow = {
  category: CompetitionCategory;
  format: CompetitionFormat;
  id: string;
  name: string;
  public_room_code: string;
  starts_at: string | null;
  status: CompetitionStatus;
  timezone: string;
  visibility: Visibility;
};

export type DashboardData = {
  activePlayers: number;
  competitions: CompetitionSummary[];
  configured: boolean;
  liveCount: number;
  user: { email?: string; id: string } | null;
};

function toSummary(row: CompetitionRow): CompetitionSummary {
  return {
    category: row.category,
    format: row.format,
    id: row.id,
    name: row.name,
    roomCode: row.public_room_code,
    startsAt: row.starts_at ?? new Date().toISOString(),
    status: row.status,
    timezone: row.timezone,
    visibility: row.visibility,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const { configured, user } = await getCurrentUser();

  if (!configured) {
    return {
      activePlayers: 48,
      competitions: [demoCompetition],
      configured: false,
      liveCount: demoCompetition.status === "live" ? 1 : 0,
      user: null,
    };
  }

  if (!user) {
    return {
      activePlayers: 0,
      competitions: [],
      configured: true,
      liveCount: 0,
      user: null,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competitions")
    .select("id,name,category,format,status,visibility,public_room_code,starts_at,timezone")
    .eq("owner_user_id", user.id)
    .order("starts_at", { ascending: false, nullsFirst: false })
    .limit(20);

  if (error) {
    throw new Error(`Unable to load competitions: ${error.message}`);
  }

  const { count: activePlayers, error: playerCountError } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("linked_user_id", user.id)
    .eq("active", true);

  if (playerCountError) {
    throw new Error(`Unable to load player count: ${playerCountError.message}`);
  }

  const competitions = ((data ?? []) as CompetitionRow[]).map(toSummary);

  return {
    activePlayers: activePlayers ?? 0,
    competitions,
    configured: true,
    liveCount: competitions.filter((competition) => competition.status === "live").length,
    user: { email: user.email ?? undefined, id: user.id },
  };
}
