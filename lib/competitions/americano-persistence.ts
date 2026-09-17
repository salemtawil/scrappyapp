import { calculateSocialStandings } from "@/lib/competitions/social/standings";
import type { SocialEntry, SocialMatch, SocialResult, SocialRound } from "@/lib/competitions/social/social-types";
import type { CompetitionSummary } from "@/lib/competitions/types";
import { createClient } from "@/lib/supabase/server";

type CompetitionRow = {
  category: CompetitionSummary["category"];
  format: CompetitionSummary["format"];
  id: string;
  name: string;
  public_room_code: string;
  settings: Record<string, unknown>;
  starts_at: string | null;
  status: CompetitionSummary["status"];
  timezone: string;
  visibility: CompetitionSummary["visibility"];
};

type EntryRow = {
  display_name_snapshot: string;
  id: string;
  initial_rating: number | string | null;
  seed: number;
};

type RoundRow = {
  id: string;
  round_number: number;
};

type MatchRow = {
  court_label: string | null;
  id: string;
  round_id: string;
  round_number: number;
  score: { sideAScore?: number; sideBScore?: number } | null;
  side_a_entry_ids: string[] | null;
  side_b_entry_ids: string[] | null;
  state_version: number;
  status: "pending" | "completed" | "void";
};

type StoredEngineRecord = {
  rounds?: Array<{
    roundNumber: number;
    sitOutEntryIds?: string[];
  }>;
};

export type AmericanoCompetitionData = {
  competition: CompetitionSummary;
  entries: SocialEntry[];
  matches: SocialMatch[];
  results: SocialResult[];
  rounds: SocialRound[];
  standings: ReturnType<typeof calculateSocialStandings>;
  settings: {
    courtCount: number;
    roundCount: number;
    targetPoints: number;
  };
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

export async function getAmericanoCompetitionData(id: string): Promise<AmericanoCompetitionData | null> {
  return getAmericanoCompetitionDataBy("id", id);
}

export async function getAmericanoCompetitionDataByRoomCode(roomCode: string): Promise<AmericanoCompetitionData | null> {
  return getAmericanoCompetitionDataBy("public_room_code", roomCode);
}

async function getAmericanoCompetitionDataBy(
  column: "id" | "public_room_code",
  value: string,
): Promise<AmericanoCompetitionData | null> {
  const supabase = await createClient();
  const { data: competitionRow, error: competitionError } = await supabase
    .from("competitions")
    .select("id,name,category,format,status,visibility,public_room_code,starts_at,timezone,settings,engine_record")
    .eq(column, value)
    .maybeSingle();

  if (competitionError) {
    throw new Error(`Unable to load competition: ${competitionError.message}`);
  }

  if (!competitionRow) return null;

  const row = competitionRow as CompetitionRow & { engine_record: StoredEngineRecord | null };
  const [entriesResult, roundsResult, matchesResult] = await Promise.all([
    supabase
      .from("competition_entries")
      .select("id,display_name_snapshot,seed,initial_rating")
      .eq("competition_id", row.id)
      .order("seed"),
    supabase.from("rounds").select("id,round_number").eq("competition_id", row.id).order("round_number"),
    supabase
      .from("matches")
      .select("id,round_id,round_number,court_label,side_a_entry_ids,side_b_entry_ids,score,status,state_version")
      .eq("competition_id", row.id)
      .order("round_number")
      .order("court_label"),
  ]);

  if (entriesResult.error) throw new Error(`Unable to load entries: ${entriesResult.error.message}`);
  if (roundsResult.error) throw new Error(`Unable to load rounds: ${roundsResult.error.message}`);
  if (matchesResult.error) throw new Error(`Unable to load matches: ${matchesResult.error.message}`);

  const entries = ((entriesResult.data ?? []) as EntryRow[]).map((entry) => ({
    displayName: entry.display_name_snapshot,
    id: entry.id,
    initialRating: entry.initial_rating === null ? null : Number(entry.initial_rating),
    seed: entry.seed,
  }));
  const sitOutsByRound = new Map(
    (row.engine_record?.rounds ?? []).map((round) => [round.roundNumber, round.sitOutEntryIds ?? []]),
  );
  const matches = ((matchesResult.data ?? []) as MatchRow[]).map(toSocialMatch(row.settings));
  const matchesByRound = new Map<number, SocialMatch[]>();

  for (const match of matches) {
    const group = matchesByRound.get(match.roundNumber) ?? [];
    group.push(match);
    matchesByRound.set(match.roundNumber, group);
  }

  const rounds = ((roundsResult.data ?? []) as RoundRow[]).map((round) => ({
    id: round.id,
    matches: matchesByRound.get(round.round_number) ?? [],
    roundNumber: round.round_number,
    sitOutEntryIds: sitOutsByRound.get(round.round_number) ?? [],
  }));
  const results = ((matchesResult.data ?? []) as MatchRow[])
    .filter((match) => match.status === "completed" && match.score)
    .map((match) => ({
      matchId: match.id,
      sideAScore: Number(match.score?.sideAScore ?? 0),
      sideBScore: Number(match.score?.sideBScore ?? 0),
    }));

  return {
    competition: toSummary(row),
    entries,
    matches,
    results,
    rounds,
    settings: {
      courtCount: Number(row.settings.courtCount ?? 1),
      roundCount: Number(row.settings.roundCount ?? rounds.length),
      targetPoints: Number(row.settings.targetPoints ?? 24),
    },
    standings: calculateSocialStandings(entries, rounds, results),
  };
}

function toSocialMatch(settings: Record<string, unknown>) {
  return (match: MatchRow): SocialMatch => ({
    courtLabel: match.court_label ?? `Pista ${match.round_number}`,
    id: match.id,
    roundNumber: match.round_number,
    sideA: {
      entryIds: toPair(match.side_a_entry_ids),
      score: match.score?.sideAScore,
    },
    sideB: {
      entryIds: toPair(match.side_b_entry_ids),
      score: match.score?.sideBScore,
    },
    stateVersion: match.state_version,
    targetPoints: Number(settings.targetPoints ?? 24),
  });
}

function toPair(ids: string[] | null): [string, string] {
  return [ids?.[0] ?? "", ids?.[1] ?? ""];
}
