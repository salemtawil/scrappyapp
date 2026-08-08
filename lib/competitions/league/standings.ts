import type { LeagueFixture, LeaguePair } from "./schedule";

export interface SetScore {
  a: number;
  b: number;
  tiebreak?: string;
}

export interface LeagueResult {
  fixtureId: string;
  sets: SetScore[];
}

export interface LeagueStanding {
  pairId: string;
  name: string;
  seed: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  leaguePoints: number;
  setsFor: number;
  setsAgainst: number;
  setDiff: number;
  gamesFor: number;
  gamesAgainst: number;
  gameDiff: number;
}

export function validateSetScores(sets: SetScore[]) {
  if (sets.length === 0 || sets.length > 3) return "Introduce entre 1 y 3 sets.";
  for (const set of sets) {
    if (!Number.isInteger(set.a) || !Number.isInteger(set.b) || set.a < 0 || set.b < 0) {
      return "Los juegos deben ser enteros positivos.";
    }
    const max = Math.max(set.a, set.b);
    const min = Math.min(set.a, set.b);
    const validNormal = (max === 6 && min <= 4) || (max === 7 && (min === 5 || min === 6));
    const validMatchTieBreak = max >= 10 && max - min >= 2;
    if (!validNormal && !validMatchTieBreak) return "Hay un set imposible o contradictorio.";
  }
  return null;
}

export function calculateLeagueStandings(
  pairs: LeaguePair[],
  fixtures: LeagueFixture[],
  results: LeagueResult[],
  points = { win: 3, draw: 1, loss: 0 },
) {
  const standings = new Map<string, LeagueStanding>();
  for (const pair of pairs) {
    standings.set(pair.id, {
      pairId: pair.id,
      name: pair.name,
      seed: pair.seed,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      leaguePoints: 0,
      setsFor: 0,
      setsAgainst: 0,
      setDiff: 0,
      gamesFor: 0,
      gamesAgainst: 0,
      gameDiff: 0,
    });
  }
  const fixtureById = new Map(fixtures.map((fixture) => [fixture.id, fixture]));
  for (const result of results) {
    const fixture = fixtureById.get(result.fixtureId);
    if (!fixture || validateSetScores(result.sets)) continue;
    let homeSets = 0;
    let awaySets = 0;
    let homeGames = 0;
    let awayGames = 0;
    for (const set of result.sets) {
      homeGames += set.a;
      awayGames += set.b;
      if (set.a > set.b) homeSets += 1;
      if (set.b > set.a) awaySets += 1;
    }
    applyLeagueResult(standings.get(fixture.homePairId), homeSets, awaySets, homeGames, awayGames, points);
    applyLeagueResult(standings.get(fixture.awayPairId), awaySets, homeSets, awayGames, homeGames, points);
  }
  return [...standings.values()].sort(
    (a, b) =>
      b.leaguePoints - a.leaguePoints ||
      b.setDiff - a.setDiff ||
      b.gameDiff - a.gameDiff ||
      b.gamesFor - a.gamesFor ||
      a.seed - b.seed,
  );
}

function applyLeagueResult(
  row: LeagueStanding | undefined,
  setsFor: number,
  setsAgainst: number,
  gamesFor: number,
  gamesAgainst: number,
  points: { win: number; draw: number; loss: number },
) {
  if (!row) return;
  row.played += 1;
  row.setsFor += setsFor;
  row.setsAgainst += setsAgainst;
  row.setDiff = row.setsFor - row.setsAgainst;
  row.gamesFor += gamesFor;
  row.gamesAgainst += gamesAgainst;
  row.gameDiff = row.gamesFor - row.gamesAgainst;
  if (setsFor > setsAgainst) {
    row.wins += 1;
    row.leaguePoints += points.win;
  } else if (setsFor === setsAgainst) {
    row.draws += 1;
    row.leaguePoints += points.draw;
  } else {
    row.losses += 1;
    row.leaguePoints += points.loss;
  }
}
