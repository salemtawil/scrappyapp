import type {
  SocialEntry,
  SocialResult,
  SocialRound,
  SocialStanding,
} from "./social-types";

/**
 * Orden de desempate de la clasificación.
 * - POINTS_FIRST: manda el total de games (Americano/Mexicano clásico).
 * - WINS_FIRST: mandan las victorias y los games desempatan.
 */
export type StandingsRanking = "POINTS_FIRST" | "WINS_FIRST";

export interface StandingsOptions {
  ranking?: StandingsRanking;
}

export function calculateSocialStandings(
  entries: SocialEntry[],
  rounds: SocialRound[],
  results: SocialResult[],
  options: StandingsOptions = {},
): SocialStanding[] {
  const ranking = options.ranking ?? "POINTS_FIRST";
  const resultByMatchId = new Map(results.map((result) => [result.matchId, result]));
  const standings = new Map<string, SocialStanding>();

  for (const entry of entries) {
    standings.set(entry.id, {
      entryId: entry.id,
      displayName: entry.displayName,
      seed: entry.seed,
      played: 0,
      wins: 0,
      ties: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      sitOuts: 0,
      headToHead: {},
    });
  }

  for (const round of rounds) {
    for (const entryId of round.sitOutEntryIds) {
      const row = standings.get(entryId);
      if (row) row.sitOuts += 1;
    }

    for (const match of round.matches) {
      const result = resultByMatchId.get(match.id);
      if (!result) continue;
      const sideAWon = result.sideAScore > result.sideBScore;
      const sideBWon = result.sideBScore > result.sideAScore;
      for (const entryId of match.sideA.entryIds) {
        addMatch(standings.get(entryId), result.sideAScore, result.sideBScore, sideAWon, sideBWon);
        addHeadToHead(standings.get(entryId), match.sideB.entryIds, sideAWon, sideBWon);
      }
      for (const entryId of match.sideB.entryIds) {
        addMatch(standings.get(entryId), result.sideBScore, result.sideAScore, sideBWon, sideAWon);
        addHeadToHead(standings.get(entryId), match.sideA.entryIds, sideBWon, sideAWon);
      }
    }
  }

  return [...standings.values()].sort(standingsComparator(ranking));
}

function addMatch(
  standing: SocialStanding | undefined,
  pointsFor: number,
  pointsAgainst: number,
  won: boolean,
  lost: boolean,
) {
  if (!standing) return;
  standing.played += 1;
  standing.pointsFor += pointsFor;
  standing.pointsAgainst += pointsAgainst;
  standing.pointDiff = standing.pointsFor - standing.pointsAgainst;
  if (won) standing.wins += 1;
  else if (lost) standing.losses += 1;
  else standing.ties += 1;
}

function addHeadToHead(
  standing: SocialStanding | undefined,
  opponentIds: readonly string[],
  won: boolean,
  lost: boolean,
) {
  if (!standing || (!won && !lost)) return;
  const delta = won ? 1 : -1;
  for (const opponentId of opponentIds) {
    standing.headToHead[opponentId] = (standing.headToHead[opponentId] ?? 0) + delta;
  }
}

export function headToHeadDelta(a: SocialStanding, b: SocialStanding) {
  return (a.headToHead[b.entryId] ?? 0) - (b.headToHead[a.entryId] ?? 0);
}

export function standingsComparator(ranking: StandingsRanking = "POINTS_FIRST") {
  return (a: SocialStanding, b: SocialStanding) => {
    if (ranking === "WINS_FIRST") {
      return (
        b.wins - a.wins ||
        a.losses - b.losses ||
        headToHeadDelta(b, a) ||
        b.pointsFor - a.pointsFor ||
        b.pointDiff - a.pointDiff ||
        a.seed - b.seed
      );
    }
    return (
      b.pointsFor - a.pointsFor ||
      b.wins - a.wins ||
      a.losses - b.losses ||
      b.pointDiff - a.pointDiff ||
      headToHeadDelta(b, a) ||
      a.seed - b.seed
    );
  };
}

/** Compatibilidad con el comparador previo (clasificación por games). */
export const compareSocialStandings = standingsComparator("POINTS_FIRST");
