import type { ScoringMode, SocialMatch, SocialResult, SocialScoring } from "./social-types";

export const MAX_TARGET_POINTS = 99;

export const scoringModeLabels: Record<ScoringMode, string> = {
  FIXED_TOTAL: "Suma fija",
  FREE_POINTS: "Puntos libres",
};

export const scoringModeHints: Record<ScoringMode, string> = {
  FIXED_TOTAL: "Los dos marcadores deben sumar exactamente los games objetivo. Evita errores de captura.",
  FREE_POINTS: "Cada pareja anota por separado, hasta el máximo indicado. Útil para partidos a tiempo.",
};

/**
 * Regla única de validación de marcadores, compartida por el formulario y por la acción de servidor.
 * Devuelve `null` cuando el marcador es válido y un mensaje en español cuando no lo es.
 */
export function validateSocialScore(
  sideAScore: number,
  sideBScore: number,
  scoring: SocialScoring,
): string | null {
  if (!Number.isInteger(sideAScore) || !Number.isInteger(sideBScore)) {
    return "Los games deben ser números enteros.";
  }
  if (sideAScore < 0 || sideBScore < 0) {
    return "Los games no pueden ser negativos.";
  }
  if (scoring.mode === "FIXED_TOTAL") {
    if (sideAScore + sideBScore !== scoring.targetPoints) {
      return `La suma de games debe ser ${scoring.targetPoints}.`;
    }
    return null;
  }
  if (sideAScore > scoring.targetPoints || sideBScore > scoring.targetPoints) {
    return `Ningún lado puede pasar de ${scoring.targetPoints} games.`;
  }
  if (sideAScore === 0 && sideBScore === 0) {
    return "Registra al menos un game para dar el partido por jugado.";
  }
  return null;
}

/** Compatibilidad: validación del modo clásico de suma fija. */
export function validateFixedTotalScore(
  sideAScore: number,
  sideBScore: number,
  targetPoints: number,
) {
  return validateSocialScore(sideAScore, sideBScore, { mode: "FIXED_TOTAL", targetPoints });
}

/** Completa el marcador contrario en modo suma fija; en puntos libres no hay complemento. */
export function complementaryScore(score: number, scoring: SocialScoring): number | null {
  if (scoring.mode !== "FIXED_TOTAL") return null;
  if (!Number.isInteger(score) || score < 0 || score > scoring.targetPoints) return null;
  return scoring.targetPoints - score;
}

export function socialMatchResult(match: SocialMatch): SocialResult | null {
  if (match.status !== "completed") return null;
  if (match.sideA.score === undefined || match.sideB.score === undefined) return null;
  return {
    matchId: match.id,
    sideAScore: match.sideA.score,
    sideBScore: match.sideB.score,
  };
}

export function winnerSideOf(sideAScore: number, sideBScore: number): "A" | "B" | null {
  if (sideAScore === sideBScore) return null;
  return sideAScore > sideBScore ? "A" : "B";
}
