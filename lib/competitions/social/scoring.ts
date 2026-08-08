import type { SocialMatch, SocialResult } from "./social-types";

export function validateFixedTotalScore(
  sideAScore: number,
  sideBScore: number,
  targetPoints: number,
) {
  if (!Number.isInteger(sideAScore) || !Number.isInteger(sideBScore)) {
    return "Los puntos deben ser números enteros.";
  }
  if (sideAScore < 0 || sideBScore < 0) {
    return "Los puntos no pueden ser negativos.";
  }
  if (sideAScore + sideBScore !== targetPoints) {
    return `La suma debe ser ${targetPoints}.`;
  }
  return null;
}

export function socialMatchResult(match: SocialMatch): SocialResult | null {
  if (match.sideA.score === undefined || match.sideB.score === undefined) {
    return null;
  }
  return {
    matchId: match.id,
    sideAScore: match.sideA.score,
    sideBScore: match.sideB.score,
  };
}
