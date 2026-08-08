export interface LeaguePair {
  id: string;
  name: string;
  seed: number;
}

export interface LeagueFixture {
  id: string;
  roundNumber: number;
  courtLabel?: string;
  homePairId: string;
  awayPairId: string;
}

export function generateLeagueSchedule(
  pairs: LeaguePair[],
  courtCount: number,
  doubleRoundRobin = false,
) {
  if (pairs.length < 2) throw new Error("A league needs at least two pairs.");
  const ordered = [...pairs].sort((a, b) => a.seed - b.seed);
  const hasBye = ordered.length % 2 === 1;
  const slots: Array<LeaguePair | null> = hasBye ? [...ordered, null] : ordered;
  const rounds: LeagueFixture[][] = [];
  const roundsCount = slots.length - 1;
  for (let round = 0; round < roundsCount; round += 1) {
    const fixtures: LeagueFixture[] = [];
    for (let index = 0; index < slots.length / 2; index += 1) {
      const home = slots[index];
      const away = slots[slots.length - 1 - index];
      if (home && away) {
        const flip = round % 2 === 1;
        fixtures.push({
          id: `league-r${round + 1}-m${fixtures.length + 1}`,
          roundNumber: round + 1,
          courtLabel: fixtures.length < courtCount ? `Pista ${fixtures.length + 1}` : undefined,
          homePairId: flip ? away.id : home.id,
          awayPairId: flip ? home.id : away.id,
        });
      }
    }
    rounds.push(fixtures);
    const fixed = slots[0];
    const rotating = slots.slice(1);
    rotating.unshift(rotating.pop()!);
    slots.splice(0, slots.length, fixed, ...rotating);
  }
  if (!doubleRoundRobin) return rounds;
  const secondLeg = rounds.map((round, roundIndex) =>
    round.map((fixture, matchIndex) => ({
      ...fixture,
      id: `league-r${rounds.length + roundIndex + 1}-m${matchIndex + 1}`,
      roundNumber: rounds.length + roundIndex + 1,
      homePairId: fixture.awayPairId,
      awayPairId: fixture.homePairId,
    })),
  );
  return [...rounds, ...secondLeg];
}
