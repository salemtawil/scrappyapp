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

export function regenerateMexicanoAfterHistoricalEdit(
  input: MexicanoInput,
  editedRoundNumber: number,
): SocialRound[] {
  return (input.priorRounds ?? []).filter((round) => round.roundNumber <= editedRoundNumber);
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
  const active = selectActiveRankedPlayers(rankedEntries, priorRounds, activeCount, input.seed, roundNumber);
  const sitOutSet = new Set(active.map((entry) => entry.id));
  const sitOutEntryIds = input.entries.filter((entry) => !sitOutSet.has(entry.id)).map((entry) => entry.id);
  const matches: SocialMatch[] = [];
  for (let index = 0; index < active.length; index += 4) {
    const group = active.slice(index, index + 4);
    if (group.length < 4) continue;
    const courtNumber = matches.length + 1;
    matches.push({
      id: `mexicano-r${roundNumber}-m${courtNumber}`,
      roundNumber,
      courtLabel: `Pista ${courtNumber}`,
      sideA: { entryIds: [group[0].id, group[3].id] },
      sideB: { entryIds: [group[1].id, group[2].id] },
      targetPoints: input.targetPoints,
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

function selectActiveRankedPlayers(
  rankedEntries: SocialEntry[],
  priorRounds: SocialRound[],
  activeCount: number,
  seed: string,
  roundNumber: number,
) {
  if (activeCount >= rankedEntries.length) return rankedEntries;
  const sitOutCounts = new Map(rankedEntries.map((entry) => [entry.id, 0]));
  const lastSitOuts = new Set(priorRounds.at(-1)?.sitOutEntryIds ?? []);
  for (const round of priorRounds) {
    for (const entryId of round.sitOutEntryIds) {
      sitOutCounts.set(entryId, (sitOutCounts.get(entryId) ?? 0) + 1);
    }
  }

  // Mexicano keeps ranking groups coherent first, but the rest candidate in each
  // four-player band is chosen by rest debt and consecutive-rest avoidance.
  const selected: SocialEntry[] = [];
  for (let index = 0; index < rankedEntries.length; index += 4) {
    const group = rankedEntries.slice(index, index + 4);
    if (selected.length + group.length <= activeCount) {
      selected.push(...group);
      continue;
    }
    const needed = activeCount - selected.length;
    selected.push(
      ...group
        .sort((a, b) => {
          const restDebt = (sitOutCounts.get(b.id) ?? 0) - (sitOutCounts.get(a.id) ?? 0);
          const consecutive = Number(lastSitOuts.has(a.id)) - Number(lastSitOuts.has(b.id));
          return (
            restDebt ||
            consecutive ||
            seededTieBreak(seed, `${roundNumber}:active:${a.id}`) -
              seededTieBreak(seed, `${roundNumber}:active:${b.id}`)
          );
        })
        .slice(0, needed),
    );
    break;
  }
  return selected.sort(
    (a, b) => rankedEntries.findIndex((entry) => entry.id === a.id) - rankedEntries.findIndex((entry) => entry.id === b.id),
  );
}

export function canGenerateMexicanoNextRound(round: SocialRound, results: SocialResult[]) {
  const completed = new Set(results.map((result) => result.matchId));
  return round.matches.every((match) => completed.has(match.id));
}
