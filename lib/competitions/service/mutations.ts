import "server-only";
import { AppError } from "@/lib/validation/app-error";
import { createClient } from "@/lib/supabase/server";
import type { SocialEntry, SocialRound } from "@/lib/competitions/social/social-types";
import { toRoundPayload } from "./round-payload";
import type { CompetitionCategory, CompetitionFormat, Visibility } from "@/lib/competitions/types";

type PostgrestError = { code?: string; details?: string | null; message: string };

/** Traduce los errores que levantan las funciones SQL a errores de aplicación. */
function toAppError(error: PostgrestError): AppError {
  const message = `${error.message} ${error.details ?? ""}`;

  if (message.includes("STALE_MATCH_VERSION")) {
    return new AppError("stale_version", "El marcador cambió en otro dispositivo.", 409);
  }
  if (message.includes("MATCH_NOT_FOUND")) {
    return new AppError("not_found", "Ese partido ya no existe.", 404);
  }
  if (message.includes("COMPETITION_NOT_OWNED") || message.includes("PLAYER_NOT_OWNED") || message.includes("CLUB_NOT_OWNED")) {
    return new AppError("forbidden", "No puedes modificar esta competición.", 403);
  }
  if (message.includes("NOT_AUTHENTICATED")) {
    return new AppError("unauthorized", "Tu sesión caducó. Vuelve a entrar.", 401);
  }
  if (message.includes("TOO_FEW_ENTRIES")) {
    return new AppError("validation", "Necesitas al menos 4 jugadores.", 400);
  }
  if (error.code === "PGRST202" || message.includes("Could not find the function")) {
    return new AppError(
      "engine_error",
      "Falta aplicar la migración 202609190001 en Supabase: sin ella no se pueden crear competiciones de forma atómica.",
      500,
    );
  }
  return new AppError("engine_error", `Operación rechazada por la base de datos: ${error.message}`, 500);
}

export interface CreateCompetitionInput {
  category: CompetitionCategory;
  clubId: string | null;
  entries: Array<SocialEntry & { playerId: string }>;
  format: CompetitionFormat;
  name: string;
  rounds: SocialRound[];
  settings: Record<string, unknown>;
  startsAt: string | null;
  timezone: string;
  visibility: Visibility;
}

export async function createSocialCompetition(input: CreateCompetitionInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("create_social_competition", {
      p_category: input.category,
      p_club_id: input.clubId,
      p_entries: input.entries.map((entry) => ({
        displayName: entry.displayName,
        initialRating: entry.initialRating ?? null,
        playerId: entry.playerId,
        seed: entry.seed,
      })),
      p_format: input.format,
      p_name: input.name,
      p_rounds: toRoundPayload(input.rounds, input.entries),
      p_settings: input.settings,
      p_starts_at: input.startsAt,
      p_timezone: input.timezone,
      p_visibility: input.visibility,
    })
    .maybeSingle();

  if (error) throw toAppError(error);
  const row = data as { competition_id: string; room_code: string } | null;
  if (!row) throw new AppError("engine_error", "La base de datos no devolvió la competición creada.", 500);

  return { competitionId: row.competition_id, roomCode: row.room_code };
}

export interface RecordScoreResult {
  matchId: string;
  sideAScore: number;
  sideBScore: number;
  stateVersion: number;
}

export async function recordMatchScore(params: {
  competitionId: string;
  expectedStateVersion: number;
  matchId: string;
  sideAScore: number;
  sideBScore: number;
}): Promise<RecordScoreResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_match_score", {
    p_competition_id: params.competitionId,
    p_expected_version: params.expectedStateVersion,
    p_match_id: params.matchId,
    p_side_a: params.sideAScore,
    p_side_b: params.sideBScore,
  });

  if (error) throw toAppError(error);
  return data as RecordScoreResult;
}

export async function replaceRoundsFrom(params: {
  competitionId: string;
  entries: SocialEntry[];
  fromRound: number;
  reason: string;
  rounds: SocialRound[];
}) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("replace_rounds_from", {
    p_competition_id: params.competitionId,
    p_from_round: params.fromRound,
    p_reason: params.reason,
    p_rounds: toRoundPayload(params.rounds, params.entries),
  });

  if (error) throw toAppError(error);
}
