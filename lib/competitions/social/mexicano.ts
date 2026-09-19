import { pickFairSitOuts } from "./rest-rotation";
import { seededShuffle, seededTieBreak } from "./seeded-rng";
import { calculateSocialStandings } from "./standings";
import type {
  GenerateSocialInput,
  SocialEntry,
  SocialMatch,
  SocialResult,
  SocialRound,
} from "./social-types";

export type MexicanoSeeding = "RANDOM_SEEDED" | "RATING" | "MANUAL";

export interface MexicanoInput extends GenerateSocialInput {
  firstRoundSeeding: MexicanoSeeding;
}

export function generateInitialMexicanoRound(input: MexicanoInput) {
  const ordered = orderInitialEntries(input.entries, input.firstRoundSeeding, input.seed);
  return buildMexicanoRound(ordered, input, [], 1);
}

export function generateNextMexicanoRound(input: MexicanoInput) {
  const priorRounds = input.priorRounds ?? [];
  const standings = calculateSocialStandings(input.entries, priorRounds, input.priorResults ?? []);
  const ranked = standings
    .map((standing) => input.entries.find((entry) => entry.id === standing.entryId))
    .filter((entry): entry is SocialEntry => Boolean(entry));
  return buildMexicanoRound(ranked, input, priorRounds, priorRounds.length + 1);
}

/**
 * Un Mexicano empareja cada ronda a partir de la clasificación, así que tocar un resultado
 * histórico invalida todo lo que se generó después. Devolvemos las rondas que siguen siendo
 * válidas: el emparejamiento de la ronda editada ya estaba decidido antes de jugarla, de modo
 * que se conserva, y las posteriores se descartan para regenerarlas.
 */
export function roundsSurvivingHistoricalEdit(
  rounds: SocialRound[],
  editedRoundNumber: number,
): SocialRound[] {
  return rounds.filter((round) => round.roundNumber <= editedRoundNumber);
}

/** Rondas que se perderían al editar un resultado de `editedRoundNumber`. */
export function roundsInvalidatedByHistoricalEdit(
  rounds: SocialRound[],
  editedRoundNumber: number,
): SocialRound[] {
  return rounds.filter((round) => round.roundNumber > editedRoundNumber);
}

export function regenerateMexicanoAfterHistoricalEdit(
  input: MexicanoInput,
  editedRoundNumber: number,
): SocialRound[] {
  return roundsSurvivingHistoricalEdit(input.priorRounds ?? [], editedRoundNumber);
}

function orderInitialEntries(entries: SocialEntry[], seeding: MexicanoSeeding, seed: string) {
  if (seeding === "RANDOM_SEEDED") return seededShuffle(entries, seed);
  if (seeding === "RATING") {
    return [...entries].sort(
      (a, b) =>
        (b.initialRating ?? Number.NEGATIVE_INFINITY) -
          (a.initialRating ?? Number.NEGATIVE_INFINITY) ||
        a.seed - b.seed ||
        seededTieBreak(seed, `rating:${a.id}`) - seededTieBreak(seed, `rating:${b.id}`),
    );
  }
  return [...entries].sort((a, b) => a.seed - b.seed);
}

function buildMexicanoRound(
  rankedEntries: SocialEntry[],
  input: MexicanoInput,
  priorRounds: SocialRound[],
  roundNumber: number,
): SocialRound {
  const maxMatches = Math.min(input.courtCount, Math.floor(rankedEntries.length / 4));
  const activeCount = maxMatches * 4;
  // El descanso se decide por equidad, no por posición: si saliera del último
  // tramo de la tabla, los dos peores no volverían a jugar en toda la noche.
  const sitOutEntryIds = pickFairSitOuts({
    entries: rankedEntries,
    priorRounds,
    roundNumber,
    seed: input.seed,
    sitOutCount: rankedEntries.length - activeCount,
  });
  const sitOutSet = new Set(sitOutEntryIds);
  // Quienes juegan mantienen el orden de la clasificación, así cada pista
  // reúne a cuatro jugadores de nivel parecido.
  const active = rankedEntries.filter((entry) => !sitOutSet.has(entry.id));
  const matches: SocialMatch[] = [];

  for (let index = 0; index < active.length; index += 4) {
    const group = active.slice(index, index + 4);
    if (group.length < 4) continue;
    const courtNumber = matches.length + 1;
    matches.push({
      id: `mexicano-r${roundNumber}-m${courtNumber}`,
      roundNumber,
      courtNumber,
      courtLabel: `Pista ${courtNumber}`,
      sideA: { entryIds: [group[0].id, group[3].id] },
      sideB: { entryIds: [group[1].id, group[2].id] },
      targetPoints: input.scoring.targetPoints,
      scoringMode: input.scoring.mode,
      status: "pending",
      stateVersion: 0,
    });
  }

  return {
    id: `mexicano-r${roundNumber}`,
    roundNumber,
    matches,
    sitOutEntryIds,
  };
}

export function canGenerateMexicanoNextRound(round: SocialRound, results: SocialResult[]) {
  const completed = new Set(results.map((result) => result.matchId));
  return round.matches.length > 0 && round.matches.every((match) => completed.has(match.id));
}
