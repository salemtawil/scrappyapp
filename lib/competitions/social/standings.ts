import type {
  SocialEntry,
  SocialResult,
  SocialRound,
  SocialStanding,
} from "./social-types";

export function calculateSocialStandings(
  entries: SocialEntry[],
  rounds: SocialRound[],
  results: SocialResult[],
) {
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
      }
      for (const entryId of match.sideB.entryIds) {
        addMatch(standings.get(entryId), result.sideBScore, result.sideAScore, sideBWon, sideAWon);
      }
    }
  }

  return [...standings.values()].sort(compareSocialStandings);
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

export function compareSocialStandings(a: SocialStanding, b: SocialStanding) {
  return (
    b.pointsFor - a.pointsFor ||
    b.wins - a.wins ||
    b.ties - a.ties ||
    b.pointDiff - a.pointDiff ||
    a.seed - b.seed
  );
}
