"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin";
import { generateAmericanoRounds } from "@/lib/competitions/social/americano";
import type { SocialEntry } from "@/lib/competitions/social/social-types";
import { createClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid();

const createAmericanoSchema = z.object({
  clubId: z.string().uuid().optional(),
  courtCount: z.coerce.number().int().min(1).max(16),
  name: z.string().min(1).max(100).trim(),
  playerIds: z.array(uuidSchema).min(4, "Selecciona al menos 4 jugadores."),
  roundCount: z.coerce.number().int().min(1).max(20),
  startsAt: z.string().optional(),
  targetPoints: z.coerce.number().int().min(1).max(99),
});

const scoreSchema = z.object({
  competitionId: uuidSchema,
  matchId: uuidSchema,
  sideAScore: z.coerce.number().int().min(0).max(99),
  sideBScore: z.coerce.number().int().min(0).max(99),
});

type PlayerRow = {
  display_name: string;
  id: string;
  rating: number | string | null;
};

type EntryRow = {
  display_name_snapshot: string;
  id: string;
  initial_rating: number | string | null;
  seed: number;
};

type RoundInsertRow = {
  id: string;
  round_number: number;
};

export async function createAmericanoAction(formData: FormData) {
  const parsed = createAmericanoSchema.safeParse({
    courtCount: formData.get("courtCount"),
    clubId: formData.get("clubId") || undefined,
    name: formData.get("name"),
    playerIds: formData.getAll("playerIds"),
    roundCount: formData.get("roundCount"),
    startsAt: formData.get("startsAt") || undefined,
    targetPoints: formData.get("targetPoints"),
  });

  if (!parsed.success) {
    return;
  }

  const admin = await getAdminSession();
  if (!admin.user) redirect("/auth/login?next=/competitions/new");
  if (!admin.isAdmin) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/competitions/new");
  }

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id,display_name,rating")
    .eq("linked_user_id", user.id)
    .in("id", parsed.data.playerIds);

  if (playersError) {
    throw new Error(`No pudimos cargar los jugadores: ${playersError.message}`);
  }

  const orderedPlayers = parsed.data.playerIds
    .map((id) => ((players ?? []) as PlayerRow[]).find((player) => player.id === id))
    .filter((player): player is PlayerRow => Boolean(player));

  if (orderedPlayers.length < 4) {
    return;
  }

  if (parsed.data.clubId) {
    const { data: club } = await supabase
      .from("clubs")
      .select("id")
      .eq("id", parsed.data.clubId)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (!club) {
      return;
    }
  }

  const roomCode = createRoomCode();
  const settings = {
    courtCount: parsed.data.courtCount,
    roundCount: parsed.data.roundCount,
    seed: roomCode,
    targetPoints: parsed.data.targetPoints,
  };
  const { data: competition, error: competitionError } = await supabase
    .from("competitions")
    .insert({
      category: "SOCIAL",
      club_id: parsed.data.clubId ?? null,
      engine_provider: "custom",
      format: "AMERICANO",
      name: parsed.data.name,
      owner_user_id: user.id,
      public_room_code: roomCode,
      settings,
      starts_at: parsed.data.startsAt || null,
      status: "live",
      timezone: "America/Caracas",
      visibility: "public",
    })
    .select("id")
    .single();

  if (competitionError) {
    throw new Error(`No pudimos crear la competicion: ${competitionError.message}`);
  }

  const { data: entries, error: entriesError } = await supabase
    .from("competition_entries")
    .insert(
      orderedPlayers.map((player, index) => ({
        competition_id: competition.id,
        display_name_snapshot: player.display_name,
        initial_rating: player.rating === null ? null : Number(player.rating),
        player_id: player.id,
        seed: index + 1,
        sort_order: index,
      })),
    )
    .select("id,display_name_snapshot,seed,initial_rating")
    .order("seed");

  if (entriesError) {
    throw new Error(`No pudimos agregar participantes: ${entriesError.message}`);
  }

  const socialEntries: SocialEntry[] = ((entries ?? []) as EntryRow[]).map((entry) => ({
    displayName: entry.display_name_snapshot,
    id: entry.id,
    initialRating: entry.initial_rating === null ? null : Number(entry.initial_rating),
    seed: entry.seed,
  }));
  const generatedRounds = generateAmericanoRounds({
    courtCount: parsed.data.courtCount,
    entries: socialEntries,
    roundCount: parsed.data.roundCount,
    seed: roomCode,
    targetPoints: parsed.data.targetPoints,
  });

  const { data: rounds, error: roundsError } = await supabase
    .from("rounds")
    .insert(
      generatedRounds.map((round) => ({
        competition_id: competition.id,
        engine_structure_id: round.id,
        name: `Ronda ${round.roundNumber}`,
        round_number: round.roundNumber,
      })),
    )
    .select("id,round_number");

  if (roundsError) {
    throw new Error(`No pudimos crear rondas: ${roundsError.message}`);
  }

  const dbRounds = new Map(((rounds ?? []) as RoundInsertRow[]).map((round) => [round.round_number, round.id]));
  const matchRows = generatedRounds.flatMap((round) =>
    round.matches.map((match) => ({
      competition_id: competition.id,
      court_label: match.courtLabel,
      round_id: dbRounds.get(round.roundNumber),
      round_number: round.roundNumber,
      side_a_entry_ids: match.sideA.entryIds,
      side_b_entry_ids: match.sideB.entryIds,
      status: "pending",
    })),
  );
  const { error: matchesError } = await supabase.from("matches").insert(matchRows);

  if (matchesError) {
    throw new Error(`No pudimos crear partidos: ${matchesError.message}`);
  }

  await supabase
    .from("competitions")
    .update({
      engine_record: {
        rounds: generatedRounds.map((round) => ({
          roundNumber: round.roundNumber,
          sitOutEntryIds: round.sitOutEntryIds,
        })),
      },
    })
    .eq("id", competition.id)
    .eq("owner_user_id", user.id);

  revalidatePath("/dashboard");
  redirect(`/competitions/${competition.id}`);
}

export async function saveMatchScoreAction(formData: FormData) {
  const parsed = scoreSchema.safeParse({
    competitionId: formData.get("competitionId"),
    matchId: formData.get("matchId"),
    sideAScore: formData.get("sideAScore"),
    sideBScore: formData.get("sideBScore"),
  });

  if (!parsed.success) {
    return;
  }

  const admin = await getAdminSession();
  if (!admin.user) redirect(`/auth/login?next=/competitions/${parsed.data.competitionId}/live`);
  if (!admin.isAdmin) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/competitions/${parsed.data.competitionId}/live`);
  }

  const winnerSide =
    parsed.data.sideAScore === parsed.data.sideBScore
      ? null
      : parsed.data.sideAScore > parsed.data.sideBScore
        ? "A"
        : "B";

  const { error } = await supabase
    .from("matches")
    .update({
      completed_at: new Date().toISOString(),
      score: {
        sideAScore: parsed.data.sideAScore,
        sideBScore: parsed.data.sideBScore,
      },
      status: "completed",
      updated_at: new Date().toISOString(),
      winner_side: winnerSide,
    })
    .eq("id", parsed.data.matchId)
    .eq("competition_id", parsed.data.competitionId);

  if (error) {
    throw new Error(`No pudimos guardar el marcador: ${error.message}`);
  }

  revalidatePath(`/competitions/${parsed.data.competitionId}`);
  revalidatePath(`/competitions/${parsed.data.competitionId}/live`);
}

function createRoomCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
}
