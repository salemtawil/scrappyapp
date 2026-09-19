import { seededTieBreak } from "./seeded-rng";
import type { SocialEntry, SocialRound } from "./social-types";

/**
 * Reparto de descansos, común a todos los formatos sociales.
 *
 * Criterios, en orden:
 *  1. descansa quien menos ha descansado;
 *  2. entre iguales, quien no descansó la ronda anterior;
 *  3. desempate por semilla, para que el calendario sea reproducible.
 *
 * Sin esto, en Mexicano descansaban siempre los mismos: el reparto salía del
 * último tramo de la clasificación y los dos últimos no volvían a jugar.
 */
export function pickFairSitOuts(params: {
  entries: readonly SocialEntry[];
  priorRounds: readonly SocialRound[];
  roundNumber: number;
  seed: string;
  sitOutCount: number;
}): string[] {
  if (params.sitOutCount <= 0) return [];

  const sitOutCounts = new Map(params.entries.map((entry) => [entry.id, 0]));
  for (const round of params.priorRounds) {
    for (const entryId of round.sitOutEntryIds) {
      sitOutCounts.set(entryId, (sitOutCounts.get(entryId) ?? 0) + 1);
    }
  }
  const lastSitOuts = new Set(params.priorRounds.at(-1)?.sitOutEntryIds ?? []);

  return [...params.entries]
    .sort(
      (a, b) =>
        (sitOutCounts.get(a.id) ?? 0) - (sitOutCounts.get(b.id) ?? 0) ||
        Number(lastSitOuts.has(a.id)) - Number(lastSitOuts.has(b.id)) ||
        seededTieBreak(params.seed, `${params.roundNumber}:sit:${a.id}`) -
          seededTieBreak(params.seed, `${params.roundNumber}:sit:${b.id}`),
    )
    .slice(0, params.sitOutCount)
    .map((entry) => entry.id);
}
