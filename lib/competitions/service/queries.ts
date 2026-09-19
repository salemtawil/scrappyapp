import { notFound } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { demoPublicSnapshot, DEMO_ROOM_CODE } from "@/lib/demo-data";
import type {
  MatchState,
  ScoringMode,
  SocialEntry,
  SocialMatch,
  SocialRound,
} from "@/lib/competitions/social/social-types";
import type { CompetitionFormat, CompetitionStatus, Visibility } from "@/lib/competitions/types";
import { assembleSocialCompetition } from "./assemble";
import type { SocialCompetitionView } from "./types";

type CompetitionRow = {
  category: SocialCompetitionView["competition"]["category"];
  club_id: string | null;
  format: CompetitionFormat;
  id: string;
  name: string;
  public_room_code: string;
  settings: Record<string, unknown> | null;
  starts_at: string | null;
  state_version: number;
  status: CompetitionStatus;
  timezone: string;
  visibility: Visibility;
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
  sit_out_entry_ids: string[] | null;
};

type MatchRow = {
  court_label: string | null;
  court_number: number | null;
  id: string;
  round_id: string;
  round_number: number;
  score: { sideAScore?: number; sideBScore?: number } | null;
  side_a_entry_ids: string[] | null;
  side_b_entry_ids: string[] | null;
  state_version: number;
  status: MatchState;
};

/**
 * Vista de organizador. Depende de RLS: Supabase solo devuelve la competición
 * si la sesión es su dueña, así que no hace falta un filtro extra por owner.
 */
export async function getOwnedCompetition(id: string): Promise<SocialCompetitionView | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createClient();
  const { data: competitionRow, error } = await supabase
    .from("competitions")
    .select(
      "id,name,category,format,status,visibility,public_room_code,starts_at,timezone,settings,state_version,club_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No pudimos cargar la competición: ${error.message}`);
  if (!competitionRow) return null;

  const row = competitionRow as CompetitionRow;
  const [entriesResult, roundsResult, matchesResult, clubResult] = await Promise.all([
    supabase
      .from("competition_entries")
      .select("id,display_name_snapshot,seed,initial_rating")
      .eq("competition_id", row.id)
      .eq("status", "active")
      .order("seed"),
    supabase
      .from("rounds")
      .select("id,round_number,sit_out_entry_ids")
      .eq("competition_id", row.id)
      .order("round_number"),
    supabase
      .from("matches")
      .select(
        "id,round_id,round_number,court_number,court_label,side_a_entry_ids,side_b_entry_ids,score,status,state_version",
      )
      .eq("competition_id", row.id)
      .order("round_number")
      .order("court_number"),
    row.club_id
      ? supabase.from("clubs").select("name,slug").eq("id", row.club_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (entriesResult.error) throw new Error(`No pudimos cargar participantes: ${entriesResult.error.message}`);
  if (roundsResult.error) throw new Error(`No pudimos cargar rondas: ${roundsResult.error.message}`);
  if (matchesResult.error) throw new Error(`No pudimos cargar partidos: ${matchesResult.error.message}`);

  const scoringMode = (row.settings?.scoringMode as ScoringMode) ?? "FIXED_TOTAL";
  const targetPoints = Number(row.settings?.targetPoints ?? 24);
  const entries: SocialEntry[] = ((entriesResult.data ?? []) as EntryRow[]).map((entry) => ({
    displayName: entry.display_name_snapshot,
    id: entry.id,
    initialRating: entry.initial_rating === null ? null : Number(entry.initial_rating),
    seed: entry.seed,
  }));
  const matchesByRoundId = new Map<string, SocialMatch[]>();

  for (const match of (matchesResult.data ?? []) as MatchRow[]) {
    const group = matchesByRoundId.get(match.round_id) ?? [];
    group.push({
      courtLabel: match.court_label ?? `Pista ${match.court_number ?? group.length + 1}`,
      courtNumber: match.court_number ?? group.length + 1,
      id: match.id,
      roundNumber: match.round_number,
      scoringMode,
      sideA: { entryIds: toPair(match.side_a_entry_ids), score: match.score?.sideAScore },
      sideB: { entryIds: toPair(match.side_b_entry_ids), score: match.score?.sideBScore },
      stateVersion: match.state_version,
      status: match.status,
      targetPoints,
    });
    matchesByRoundId.set(match.round_id, group);
  }

  const rounds: SocialRound[] = ((roundsResult.data ?? []) as RoundRow[]).map((round) => ({
    id: round.id,
    matches: (matchesByRoundId.get(round.id) ?? []).sort((a, b) => a.courtNumber - b.courtNumber),
    roundNumber: round.round_number,
    sitOutEntryIds: round.sit_out_entry_ids ?? [],
  }));
  const club = (clubResult.data ?? null) as { name: string; slug: string } | null;

  return assembleSocialCompetition({
    competition: {
      category: row.category,
      format: row.format,
      id: row.id,
      name: row.name,
      organization: club ? { name: club.name, slug: String(club.slug) } : null,
      roomCode: row.public_room_code,
      startsAt: row.starts_at ?? new Date().toISOString(),
      stateVersion: row.state_version,
      status: row.status,
      timezone: row.timezone,
      visibility: row.visibility,
    },
    entries,
    format: row.format,
    rawSettings: row.settings,
    rounds,
  });
}

export async function requireOwnedCompetition(id: string) {
  const data = await getOwnedCompetition(id);
  if (!data) notFound();
  return data;
}

/** Documento saneado que devuelve `public_competition_snapshot`. */
type PublicSnapshot = {
  competition: {
    category: SocialCompetitionView["competition"]["category"];
    format: CompetitionFormat;
    name: string;
    organization: { name: string; slug: string } | null;
    plannedRounds: number;
    roomCode: string;
    scoringMode: ScoringMode;
    startsAt: string | null;
    stateVersion: number;
    status: CompetitionStatus;
    targetPoints: number;
    timezone: string;
  };
  participants: Array<{ name: string; ref: string; seed: number }>;
  rounds: Array<{
    matches: Array<{
      courtLabel: string;
      courtNumber: number;
      ref: string;
      sideARefs: string[];
      sideAScore: number | null;
      sideBRefs: string[];
      sideBScore: number | null;
      status: MatchState;
    }>;
    roundNumber: number;
    sitOutRefs: string[];
  }>;
};

/**
 * Sala pública. Nunca toca las tablas: usa la función saneada, que no expone
 * correos, teléfonos, notas, valoraciones, ajustes de motor ni identificadores internos.
 */
export async function getPublicCompetition(roomCode: string): Promise<SocialCompetitionView | null> {
  const normalized = roomCode.trim().toUpperCase();

  if (!hasSupabaseEnv()) {
    return normalized === DEMO_ROOM_CODE ? buildPublicView(demoPublicSnapshot(), true) : null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_competition_snapshot", { p_room_code: normalized });

  if (error) throw new Error(`No pudimos cargar la sala pública: ${error.message}`);
  if (!data) return null;

  return buildPublicView(data as PublicSnapshot, false);
}

function buildPublicView(snapshot: PublicSnapshot, isDemo: boolean): SocialCompetitionView {
  const entries: SocialEntry[] = snapshot.participants.map((participant) => ({
    displayName: participant.name,
    id: participant.ref,
    initialRating: null,
    seed: participant.seed,
  }));
  const rounds: SocialRound[] = snapshot.rounds.map((round) => ({
    id: `round-${round.roundNumber}`,
    matches: round.matches.map((match) => ({
      courtLabel: match.courtLabel,
      courtNumber: match.courtNumber,
      id: match.ref,
      roundNumber: round.roundNumber,
      scoringMode: snapshot.competition.scoringMode,
      sideA: { entryIds: toPair(match.sideARefs), score: match.sideAScore ?? undefined },
      sideB: { entryIds: toPair(match.sideBRefs), score: match.sideBScore ?? undefined },
      stateVersion: 0,
      status: match.status,
      targetPoints: snapshot.competition.targetPoints,
    })),
    roundNumber: round.roundNumber,
    sitOutEntryIds: round.sitOutRefs,
  }));

  return assembleSocialCompetition({
    competition: {
      category: snapshot.competition.category,
      format: snapshot.competition.format,
      id: snapshot.competition.roomCode,
      name: snapshot.competition.name,
      organization: snapshot.competition.organization,
      roomCode: snapshot.competition.roomCode,
      startsAt: snapshot.competition.startsAt ?? new Date().toISOString(),
      stateVersion: snapshot.competition.stateVersion,
      status: snapshot.competition.status,
      timezone: snapshot.competition.timezone,
      visibility: "public",
    },
    entries,
    format: snapshot.competition.format,
    isDemo,
    rawSettings: {
      courtCount: Math.max(1, ...snapshot.rounds.map((round) => round.matches.length), 1),
      roundCount: snapshot.competition.plannedRounds || snapshot.rounds.length || 1,
      scoringMode: snapshot.competition.scoringMode,
      seed: "public",
      targetPoints: snapshot.competition.targetPoints,
    },
    rounds,
  });
}

function toPair(ids: readonly string[] | null): [string, string] {
  return [ids?.[0] ?? "", ids?.[1] ?? ""];
}
