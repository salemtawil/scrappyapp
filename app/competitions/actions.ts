"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth/admin";
import { getFormatDefinition, hasBlockingNotices, usableCourts } from "@/lib/competitions/formats/registry";
import { isAvailableFormat } from "@/lib/competitions/formats/types";
import { mexicanoSeedingSchema, scoringModeSchema } from "@/lib/competitions/formats/settings";
import {
  createSocialCompetition,
  recordMatchScore,
  replaceRoundsFrom,
} from "@/lib/competitions/service/mutations";
import { getOwnedCompetition } from "@/lib/competitions/service/queries";
import { validateSocialScore, MAX_TARGET_POINTS } from "@/lib/competitions/social/scoring";
import type { SocialEntry } from "@/lib/competitions/social/social-types";
import { AppError } from "@/lib/validation/app-error";
import { errorState, fieldErrorsFrom, successState, type FormState } from "@/lib/validation/form-state";
import { createClient } from "@/lib/supabase/server";
import type { CompetitionFormat } from "@/lib/competitions/types";

const createSchema = z.object({
  clubId: z.string().uuid().optional(),
  courtCount: z.coerce.number({ message: "Indica cuántas pistas usarás." }).int().min(1).max(16),
  firstRoundSeeding: mexicanoSeedingSchema.default("RANDOM_SEEDED"),
  format: z.string().min(1, "Elige un formato."),
  name: z.string().trim().min(1, "Ponle nombre a la competición.").max(100),
  playerIds: z.array(z.string().uuid()).min(4, "Selecciona al menos 4 jugadores."),
  roundCount: z.coerce.number({ message: "Indica cuántas rondas quieres." }).int().min(1).max(30),
  scoringMode: scoringModeSchema.default("FIXED_TOTAL"),
  startsAt: z.string().optional(),
  targetPoints: z.coerce
    .number({ message: "Indica los games objetivo." })
    .int()
    .min(1)
    .max(MAX_TARGET_POINTS),
});

const scoreSchema = z.object({
  competitionId: z.string().uuid(),
  confirmCascade: z.coerce.boolean().default(false),
  expectedStateVersion: z.coerce.number().int().min(0),
  matchId: z.string().uuid(),
  sideAScore: z.coerce.number({ message: "Escribe los games." }).int(),
  sideBScore: z.coerce.number({ message: "Escribe los games." }).int(),
});

const competitionIdSchema = z.object({ competitionId: z.string().uuid() });

function appErrorState(error: unknown): FormState {
  if (error instanceof AppError) return errorState(error.message);
  throw error;
}

export async function createCompetitionAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = createSchema.safeParse({
    clubId: formData.get("clubId") || undefined,
    courtCount: formData.get("courtCount"),
    firstRoundSeeding: formData.get("firstRoundSeeding") || undefined,
    format: formData.get("format"),
    name: formData.get("name"),
    playerIds: formData.getAll("playerIds"),
    roundCount: formData.get("roundCount"),
    scoringMode: formData.get("scoringMode") || undefined,
    startsAt: formData.get("startsAt") || undefined,
    targetPoints: formData.get("targetPoints"),
  });

  if (!parsed.success) {
    return errorState("Revisa los campos marcados.", fieldErrorsFrom(parsed.error));
  }

  const admin = await getAdminSession();
  if (!admin.user) {
    return errorState("Tu sesión caducó. Vuelve a entrar para crear la competición.");
  }
  if (!admin.isAdmin) {
    return errorState("Tu correo no está autorizado para crear competiciones.");
  }

  const definition = getFormatDefinition(parsed.data.format as CompetitionFormat);
  if (!definition || !isAvailableFormat(definition)) {
    return errorState("Ese formato todavía no está disponible.", { format: "Elige un formato disponible." });
  }

  const supabase = await createClient();
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id,display_name,rating")
    .eq("linked_user_id", admin.user.id)
    .in("id", parsed.data.playerIds);

  if (playersError) {
    return errorState(`No pudimos cargar los jugadores: ${playersError.message}`);
  }

  const playerById = new Map(
    ((players ?? []) as Array<{ display_name: string; id: string; rating: number | string | null }>).map(
      (player) => [player.id, player],
    ),
  );
  const entries = parsed.data.playerIds
    .map((id) => playerById.get(id))
    .filter((player): player is { display_name: string; id: string; rating: number | string | null } =>
      Boolean(player),
    )
    .map((player, index) => ({
      displayName: player.display_name,
      id: player.id,
      initialRating: player.rating === null ? null : Number(player.rating),
      playerId: player.id,
      seed: index + 1,
    }));

  if (entries.length !== parsed.data.playerIds.length) {
    return errorState("Alguno de los jugadores seleccionados ya no existe.", {
      playerIds: "Vuelve a elegir la lista de jugadores.",
    });
  }

  const scoring = { mode: parsed.data.scoringMode, targetPoints: parsed.data.targetPoints };
  const courtCount = usableCourts(entries.length, parsed.data.courtCount);
  const notices = definition.inspectSetup({
    courtCount: parsed.data.courtCount,
    entryCount: entries.length,
    roundCount: parsed.data.roundCount,
    scoring,
  });

  if (hasBlockingNotices(notices)) {
    const fieldErrors: Record<string, string> = {};
    for (const notice of notices) {
      if (notice.level === "error") fieldErrors[notice.field ?? "form"] ??= notice.message;
    }
    return errorState("La configuración no permite generar los partidos.", fieldErrors);
  }

  const seed = `${parsed.data.format}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  let rounds;
  try {
    rounds = definition.generateInitialRounds({
      courtCount,
      entries: entries as SocialEntry[],
      firstRoundSeeding: parsed.data.firstRoundSeeding,
      roundCount: parsed.data.roundCount,
      scoring,
      seed,
    });
  } catch (error) {
    return errorState(
      error instanceof Error ? error.message : "No pudimos generar el calendario con esa configuración.",
    );
  }

  let created;
  try {
    created = await createSocialCompetition({
      category: definition.category,
      clubId: parsed.data.clubId ?? null,
      entries,
      format: definition.format,
      name: parsed.data.name,
      rounds,
      settings: {
        courtCount,
        firstRoundSeeding: parsed.data.firstRoundSeeding,
        roundCount: parsed.data.roundCount,
        scoringMode: scoring.mode,
        seed,
        targetPoints: scoring.targetPoints,
      },
      startsAt: parsed.data.startsAt || null,
      timezone: "America/Caracas",
      visibility: "public",
    });
  } catch (error) {
    return appErrorState(error);
  }

  revalidatePath("/dashboard");
  redirect(`/competitions/${created.competitionId}`);
}

export async function saveMatchScoreAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = scoreSchema.safeParse({
    competitionId: formData.get("competitionId"),
    confirmCascade: formData.get("confirmCascade") === "true",
    expectedStateVersion: formData.get("expectedStateVersion"),
    matchId: formData.get("matchId"),
    sideAScore: formData.get("sideAScore"),
    sideBScore: formData.get("sideBScore"),
  });

  if (!parsed.success) {
    return errorState("Revisa el marcador.", fieldErrorsFrom(parsed.error));
  }

  const admin = await getAdminSession();
  if (!admin.user) return errorState("Tu sesión caducó. Vuelve a entrar para guardar.");
  if (!admin.isAdmin) return errorState("Tu correo no está autorizado para cargar marcadores.");

  const competition = await getOwnedCompetition(parsed.data.competitionId);
  if (!competition) return errorState("Esta competición ya no está disponible.");

  const scoreError = validateSocialScore(
    parsed.data.sideAScore,
    parsed.data.sideBScore,
    competition.scoring,
  );
  if (scoreError) {
    return errorState(scoreError, { sideAScore: scoreError });
  }

  const match = competition.rounds
    .flatMap((round) => round.matches)
    .find((candidate) => candidate.id === parsed.data.matchId);
  if (!match) return errorState("Ese partido ya no existe.");

  const lastRoundNumber = competition.rounds.at(-1)?.roundNumber ?? match.roundNumber;
  const invalidatedRounds = competition.rounds.filter(
    (round) => round.roundNumber > match.roundNumber,
  );
  const cascades = competition.format.capabilities.dynamicRounds && invalidatedRounds.length > 0;

  if (cascades && !parsed.data.confirmCascade) {
    const lostResults = invalidatedRounds
      .flatMap((round) => round.matches)
      .filter((candidate) => candidate.status === "completed").length;
    return {
      details: {
        invalidatedRounds: invalidatedRounds.length,
        lostResults,
        roundNumber: match.roundNumber,
      },
      message: `En ${competition.format.label} los emparejamientos dependen de la clasificación: cambiar la ronda ${match.roundNumber} borrará ${invalidatedRounds.length} ronda${invalidatedRounds.length === 1 ? "" : "s"} posterior${invalidatedRounds.length === 1 ? "" : "es"} y ${lostResults} resultado${lostResults === 1 ? "" : "s"} ya cargado${lostResults === 1 ? "" : "s"}.`,
      status: "confirm",
    };
  }

  try {
    await recordMatchScore({
      competitionId: parsed.data.competitionId,
      expectedStateVersion: parsed.data.expectedStateVersion,
      matchId: parsed.data.matchId,
      sideAScore: parsed.data.sideAScore,
      sideBScore: parsed.data.sideBScore,
    });

    if (cascades) {
      await replaceRoundsFrom({
        competitionId: parsed.data.competitionId,
        entries: competition.entries,
        fromRound: match.roundNumber,
        reason: "round.invalidated_by_edit",
        rounds: [],
      });
    }
  } catch (error) {
    if (error instanceof AppError && error.code === "stale_version") {
      revalidatePaths(parsed.data.competitionId);
      return errorState(
        "El marcador cambió en otro dispositivo. Actualizamos los datos: revisa y vuelve a guardar.",
      );
    }
    return appErrorState(error);
  }

  revalidatePaths(parsed.data.competitionId, competition.competition.roomCode);

  if (cascades) {
    return successState(
      `Resultado corregido. Se eliminaron las rondas posteriores a la ${match.roundNumber}; genera la siguiente cuando quieras.`,
    );
  }
  return successState(
    match.roundNumber < lastRoundNumber ? "Resultado corregido." : "Marcador guardado.",
  );
}

export async function generateNextRoundAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = competitionIdSchema.safeParse({ competitionId: formData.get("competitionId") });
  if (!parsed.success) return errorState("No pudimos identificar la competición.");

  const admin = await getAdminSession();
  if (!admin.user || !admin.isAdmin) return errorState("No tienes permiso para generar rondas.");

  const competition = await getOwnedCompetition(parsed.data.competitionId);
  if (!competition) return errorState("Esta competición ya no está disponible.");

  const definition = competition.format;
  if (!definition.capabilities.dynamicRounds || !definition.generateNextRound) {
    return errorState(`${definition.label} genera todo el calendario al crearse.`);
  }

  const lastRound = competition.rounds.at(-1);
  const pending = lastRound?.matches.filter((match) => match.status !== "completed").length ?? 0;
  if (lastRound && pending > 0) {
    return errorState(
      `Faltan ${pending} marcador${pending === 1 ? "" : "es"} de la ronda ${lastRound.roundNumber} para poder emparejar la siguiente.`,
    );
  }
  if (competition.rounds.length >= competition.settings.roundCount) {
    return errorState(
      `Ya se jugaron las ${competition.settings.roundCount} rondas previstas. Cierra la competición o amplía las rondas en ajustes.`,
    );
  }

  const settings = competition.settings as { firstRoundSeeding?: "RANDOM_SEEDED" | "RATING" | "MANUAL" };
  let nextRound;
  try {
    nextRound = definition.generateNextRound({
      courtCount: competition.settings.courtCount,
      entries: competition.entries,
      firstRoundSeeding: settings.firstRoundSeeding,
      priorResults: competition.results,
      priorRounds: competition.rounds,
      roundCount: competition.settings.roundCount,
      scoring: competition.scoring,
      seed: competition.settings.seed,
    });
  } catch (error) {
    return errorState(
      error instanceof Error ? error.message : "No pudimos emparejar la siguiente ronda.",
    );
  }

  try {
    await replaceRoundsFrom({
      competitionId: parsed.data.competitionId,
      entries: competition.entries,
      fromRound: lastRound?.roundNumber ?? 0,
      reason: "round.generated",
      rounds: [nextRound],
    });
  } catch (error) {
    return appErrorState(error);
  }

  revalidatePaths(parsed.data.competitionId, competition.competition.roomCode);
  return successState(`Ronda ${nextRound.roundNumber} lista.`);
}

function revalidatePaths(competitionId: string, roomCode?: string) {
  revalidatePath(`/competitions/${competitionId}`);
  revalidatePath(`/competitions/${competitionId}/live`);
  revalidatePath("/dashboard");
  if (roomCode) {
    revalidatePath(`/r/${roomCode}`);
    revalidatePath(`/r/${roomCode}/display`);
  }
}
