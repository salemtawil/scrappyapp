import { seededTieBreak } from "./seeded-rng";
import type {
  GenerateSocialInput,
  SocialEntry,
  SocialMatch,
  SocialRound,
} from "./social-types";

type Pair = [SocialEntry, SocialEntry];

export function generateAmericanoRounds(input: GenerateSocialInput): SocialRound[] {
  validateSocialInput(input);
  const roundsToCreate = input.roundCount ?? 1;
  const rounds = [...(input.priorRounds ?? [])];
  while (rounds.length < roundsToCreate) {
    rounds.push(generateAmericanoRound(input, rounds, rounds.length + 1));
  }
  return rounds;
}

export function generateNextAmericanoRound(input: GenerateSocialInput) {
  validateSocialInput(input);
  return generateAmericanoRound(input, input.priorRounds ?? [], (input.priorRounds?.length ?? 0) + 1);
}

function generateAmericanoRound(
  input: GenerateSocialInput,
  priorRounds: SocialRound[],
  roundNumber: number,
): SocialRound {
  const maxMatches = Math.min(input.courtCount, Math.floor(input.entries.length / 4));
  const activeCount = maxMatches * 4;
  const sitOutEntryIds = pickSitOuts(input.entries, priorRounds, activeCount, input.seed, roundNumber);
  const sitOutSet = new Set(sitOutEntryIds);
  const active = input.entries.filter((entry) => !sitOutSet.has(entry.id));
  const partnerCounts = buildPairCounts(priorRounds, "partners");
  const opponentCounts = buildPairCounts(priorRounds, "opponents");
  const groupCounts = buildGroupCounts(priorRounds);
  const pairs = buildRoundPairs(active, partnerCounts, input.seed, roundNumber);
  const matches = pairIntoMatches(pairs, opponentCounts, groupCounts, input, roundNumber);
  return {
    id: `americano-r${roundNumber}`,
    roundNumber,
    matches,
    sitOutEntryIds,
  };
}

function validateSocialInput(input: GenerateSocialInput) {
  if (input.entries.length < 4 || input.entries.length > 64) {
    throw new Error("Social competitions require between 4 and 64 players.");
  }
  if (input.courtCount < 1 || input.courtCount > 16) {
    throw new Error("Court count must be between 1 and 16.");
  }
  if (input.targetPoints < 1 || input.targetPoints > 99) {
    throw new Error("Target points must be between 1 and 99.");
  }
}

function pickSitOuts(
  entries: SocialEntry[],
  priorRounds: SocialRound[],
  activeCount: number,
  seed: string,
  roundNumber: number,
) {
  const sitOutNeeded = entries.length - activeCount;
  if (sitOutNeeded <= 0) return [];
  const sitOutCounts = new Map(entries.map((entry) => [entry.id, 0]));
  const lastSitOuts = new Set(priorRounds.at(-1)?.sitOutEntryIds ?? []);
  for (const round of priorRounds) {
    for (const entryId of round.sitOutEntryIds) {
      sitOutCounts.set(entryId, (sitOutCounts.get(entryId) ?? 0) + 1);
    }
  }
  return [...entries]
    .sort((a, b) => {
      const consecutivePenalty = Number(lastSitOuts.has(a.id)) - Number(lastSitOuts.has(b.id));
      return (
        (sitOutCounts.get(a.id) ?? 0) - (sitOutCounts.get(b.id) ?? 0) ||
        consecutivePenalty ||
        seededTieBreak(seed, `${roundNumber}:sit:${a.id}`) -
          seededTieBreak(seed, `${roundNumber}:sit:${b.id}`)
      );
    })
    .slice(0, sitOutNeeded)
    .map((entry) => entry.id);
}

function buildRoundPairs(
  active: SocialEntry[],
  partnerCounts: Map<string, number>,
  seed: string,
  roundNumber: number,
) {
  const remaining = [...active].sort(
    (a, b) =>
      seededTieBreak(seed, `${roundNumber}:order:${a.id}`) -
      seededTieBreak(seed, `${roundNumber}:order:${b.id}`),
  );
  const pairs: Pair[] = [];
  while (remaining.length >= 2) {
    const first = remaining.shift()!;
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let index = 0; index < remaining.length; index += 1) {
      const candidate = remaining[index];
      const key = pairKey(first.id, candidate.id);
      const score =
        (partnerCounts.get(key) ?? 0) * 1000 +
        seededTieBreak(seed, `${roundNumber}:pair:${first.id}:${candidate.id}`) / 10000000000;
      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }
    const [second] = remaining.splice(bestIndex, 1);
    pairs.push([first, second]);
  }
  return pairs;
}

function pairIntoMatches(
  pairs: Pair[],
  opponentCounts: Map<string, number>,
  groupCounts: Map<string, number>,
  input: GenerateSocialInput,
  roundNumber: number,
) {
  const remaining = [...pairs];
  const matches: SocialMatch[] = [];
  while (remaining.length >= 2) {
    const first = remaining.shift()!;
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let index = 0; index < remaining.length; index += 1) {
      const second = remaining[index];
      const playerIds = [...first, ...second].map((entry) => entry.id);
      const opponentScore =
        opponentScoreFor(first, second, opponentCounts) +
        (groupCounts.get(groupKey(playerIds)) ?? 0) * 1000;
      const score =
        opponentScore +
        seededTieBreak(input.seed, `${roundNumber}:match:${playerIds.join(":")}`) / 10000000000;
      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }
    const [second] = remaining.splice(bestIndex, 1);
    const courtNumber = matches.length + 1;
    matches.push({
      id: `americano-r${roundNumber}-m${courtNumber}`,
      roundNumber,
      courtLabel: `Pista ${courtNumber}`,
      sideA: { entryIds: [first[0].id, first[1].id] },
      sideB: { entryIds: [second[0].id, second[1].id] },
      targetPoints: input.targetPoints,
      stateVersion: 0,
    });
  }
  return matches;
}

function opponentScoreFor(first: Pair, second: Pair, counts: Map<string, number>) {
  let score = 0;
  for (const a of first) {
    for (const b of second) score += counts.get(pairKey(a.id, b.id)) ?? 0;
  }
  return score;
}

function buildPairCounts(rounds: SocialRound[], kind: "partners" | "opponents") {
  const counts = new Map<string, number>();
  for (const round of rounds) {
    for (const match of round.matches) {
      const pairs =
        kind === "partners"
          ? [match.sideA.entryIds, match.sideB.entryIds]
          : match.sideA.entryIds.flatMap((a) => match.sideB.entryIds.map((b) => [a, b] as [string, string]));
      for (const pair of pairs) {
        const key = pairKey(pair[0], pair[1]);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }
  return counts;
}

function buildGroupCounts(rounds: SocialRound[]) {
  const counts = new Map<string, number>();
  for (const round of rounds) {
    for (const match of round.matches) {
      const key = groupKey([...match.sideA.entryIds, ...match.sideB.entryIds]);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("|");
}

function groupKey(ids: string[]) {
  return [...ids].sort().join("|");
}
