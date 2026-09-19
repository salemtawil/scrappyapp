import { getAdminSession } from "@/lib/auth/admin";
import { demoDashboardCompetition, DEMO_ROOM_CODE } from "@/lib/demo-data";
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
  club_id: string | null;
  format: CompetitionFormat;
  id: string;
  name: string;
  public_room_code: string;
  starts_at: string | null;
  status: CompetitionStatus;
  timezone: string;
  visibility: Visibility;
};

type ClubRow = {
  id: string;
  name: string;
  slug: string;
};

type EntryCountRow = {
  competition_id: string;
};

type MatchCountRow = {
  competition_id: string;
  status: "pending" | "completed" | "void";
};

export type AdminCompetition = CompetitionSummary & {
  club: { id: string; name: string; slug: string } | null;
  completedMatches: number;
  pendingMatches: number;
  playerCount: number;
};

export type DashboardData = {
  activePlayers: number;
  competitions: AdminCompetition[];
  configured: boolean;
  isAdmin: boolean;
  liveCount: number;
  matchCount: number;
  organizationCount: number;
  organizations: Array<{
    competitionCount: number;
    id: string;
    name: string;
    slug: string;
  }>;
  user: { email?: string; id: string } | null;
};

function toSummary(row: CompetitionRow): AdminCompetition {
  return {
    category: row.category,
    club: null,
    completedMatches: 0,
    format: row.format,
    id: row.id,
    name: row.name,
    pendingMatches: 0,
    playerCount: 0,
    roomCode: row.public_room_code,
    startsAt: row.starts_at ?? new Date().toISOString(),
    status: row.status,
    timezone: row.timezone,
    visibility: row.visibility,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const { configured, isAdmin, user } = await getAdminSession();

  if (!configured) {
    // Sin Supabase no hay datos reales: se muestra una única competición de ejemplo,
    // etiquetada como tal, y los contadores salen de ella en vez de inventarse.
    const demo = demoDashboardCompetition;
    return {
      activePlayers: demo.playerCount,
      competitions: [
        {
          category: "SOCIAL",
          club: null,
          completedMatches: demo.completedMatches,
          format: demo.format,
          id: DEMO_ROOM_CODE,
          name: demo.name,
          pendingMatches: demo.pendingMatches,
          playerCount: demo.playerCount,
          roomCode: demo.roomCode,
          startsAt: new Date().toISOString(),
          status: demo.status,
          timezone: "America/Caracas",
          visibility: "public",
        },
      ],
      configured: false,
      isAdmin: true,
      liveCount: 1,
      matchCount: demo.completedMatches + demo.pendingMatches,
      organizationCount: 0,
      organizations: [],
      user: null,
    };
  }

  if (!user || !isAdmin) {
    return {
      activePlayers: 0,
      competitions: [],
      configured: true,
      isAdmin,
      liveCount: 0,
      matchCount: 0,
      organizationCount: 0,
      organizations: [],
      user: user ? { email: user.email ?? undefined, id: user.id } : null,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("competitions")
    .select("id,name,category,format,status,visibility,public_room_code,starts_at,timezone,club_id")
    .eq("owner_user_id", user.id)
    .order("starts_at", { ascending: false, nullsFirst: false })
    .limit(50);

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

  const competitionRows = (data ?? []) as CompetitionRow[];
  const competitionIds = competitionRows.map((competition) => competition.id);
  const clubIds = [...new Set(competitionRows.map((competition) => competition.club_id).filter(Boolean))] as string[];
  const [ownedClubsResult, competitionClubsResult, entriesResult, matchesResult] = await Promise.all([
    supabase.from("clubs").select("id,name,slug").eq("owner_user_id", user.id).order("name"),
    clubIds.length > 0
      ? supabase.from("clubs").select("id,name,slug").in("id", clubIds)
      : Promise.resolve({ data: [], error: null }),
    competitionIds.length > 0
      ? supabase.from("competition_entries").select("competition_id").in("competition_id", competitionIds)
      : Promise.resolve({ data: [], error: null }),
    competitionIds.length > 0
      ? supabase.from("matches").select("competition_id,status").in("competition_id", competitionIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (ownedClubsResult.error) throw new Error(`Unable to load organizations: ${ownedClubsResult.error.message}`);
  if (competitionClubsResult.error) {
    throw new Error(`Unable to load competition organizations: ${competitionClubsResult.error.message}`);
  }
  if (entriesResult.error) throw new Error(`Unable to load competition entries: ${entriesResult.error.message}`);
  if (matchesResult.error) throw new Error(`Unable to load matches: ${matchesResult.error.message}`);

  const clubById = new Map(((competitionClubsResult.data ?? []) as ClubRow[]).map((club) => [club.id, club]));
  const entryCounts = new Map<string, number>();
  const matchCounts = new Map<string, { completed: number; pending: number }>();

  for (const entry of (entriesResult.data ?? []) as EntryCountRow[]) {
    entryCounts.set(entry.competition_id, (entryCounts.get(entry.competition_id) ?? 0) + 1);
  }

  for (const match of (matchesResult.data ?? []) as MatchCountRow[]) {
    const current = matchCounts.get(match.competition_id) ?? { completed: 0, pending: 0 };
    if (match.status === "completed") current.completed += 1;
    if (match.status === "pending") current.pending += 1;
    matchCounts.set(match.competition_id, current);
  }

  const competitions = competitionRows.map((row) => {
    const summary = toSummary(row);
    const club = row.club_id ? clubById.get(row.club_id) : null;
    const counts = matchCounts.get(row.id) ?? { completed: 0, pending: 0 };

    return {
      ...summary,
      club: club ? { id: club.id, name: club.name, slug: String(club.slug) } : null,
      completedMatches: counts.completed,
      pendingMatches: counts.pending,
      playerCount: entryCounts.get(row.id) ?? 0,
    };
  });
  const competitionsByClub = new Map<string, number>();

  for (const competition of competitions) {
    if (competition.club) {
      competitionsByClub.set(competition.club.id, (competitionsByClub.get(competition.club.id) ?? 0) + 1);
    }
  }

  const organizations = ((ownedClubsResult.data ?? []) as ClubRow[]).map((club) => ({
    competitionCount: competitionsByClub.get(club.id) ?? 0,
    id: club.id,
    name: club.name,
    slug: String(club.slug),
  }));

  return {
    activePlayers: activePlayers ?? 0,
    competitions,
    configured: true,
    isAdmin,
    liveCount: competitions.filter((competition) => competition.status === "live").length,
    matchCount: [...matchCounts.values()].reduce((total, counts) => total + counts.completed + counts.pending, 0),
    organizationCount: organizations.length,
    organizations,
    user: { email: user.email ?? undefined, id: user.id },
  };
}
