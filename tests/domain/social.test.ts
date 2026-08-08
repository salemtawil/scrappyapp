import { describe, expect, it } from "vitest";
import { generateAmericanoRounds } from "@/lib/competitions/social/americano";
import { generateInitialMexicanoRound, generateNextMexicanoRound } from "@/lib/competitions/social/mexicano";
import { validateFixedTotalScore } from "@/lib/competitions/social/scoring";
import { calculateSocialStandings } from "@/lib/competitions/social/standings";

const entries = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    displayName: `Jugador ${index + 1}`,
    seed: index + 1,
    initialRating: index % 3 === 0 ? 4 - index / 100 : null,
  }));

describe("Americano scheduler", () => {
  for (const count of [4, 5, 6, 7, 8, 9, 12, 16, 20]) {
    it(`keeps round invariants with ${count} players`, () => {
      const rounds = generateAmericanoRounds({
        entries: entries(count),
        courtCount: 2,
        roundCount: 4,
        targetPoints: 24,
        seed: "same",
      });
      for (const round of rounds) {
        const players = round.matches.flatMap((match) => [...match.sideA.entryIds, ...match.sideB.entryIds]);
        expect(new Set(players).size).toBe(players.length);
        expect(round.matches.length).toBeLessThanOrEqual(2);
        expect(players.length + round.sitOutEntryIds.length).toBe(count);
      }
    });
  }

  it("is deterministic", () => {
    const input = { entries: entries(8), courtCount: 2, roundCount: 6, targetPoints: 24, seed: "det" };
    expect(generateAmericanoRounds(input)).toEqual(generateAmericanoRounds(input));
  });

  it("balances sit-outs", () => {
    const rounds = generateAmericanoRounds({
      entries: entries(9),
      courtCount: 2,
      roundCount: 9,
      targetPoints: 24,
      seed: "rests",
    });
    const counts = new Map<string, number>();
    for (const round of rounds) {
      for (const id of round.sitOutEntryIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    expect(Math.max(...counts.values()) - Math.min(...counts.values())).toBeLessThanOrEqual(1);
  });
});

describe("Social scoring and standings", () => {
  it("validates fixed total scores", () => {
    expect(validateFixedTotalScore(12, 12, 24)).toBeNull();
    expect(validateFixedTotalScore(13, 12, 24)).toContain("24");
  });

  it("sorts standings by points, wins, ties and diff", () => {
    const players = entries(4);
    const rounds = generateAmericanoRounds({
      entries: players,
      courtCount: 1,
      roundCount: 1,
      targetPoints: 24,
      seed: "standings",
    });
    const standings = calculateSocialStandings(players, rounds, [
      { matchId: rounds[0].matches[0].id, sideAScore: 15, sideBScore: 9 },
    ]);
    expect(standings[0].pointsFor).toBe(15);
    expect(standings.at(-1)?.pointsFor).toBe(9);
  });
});

describe("Mexicano scheduler", () => {
  it("uses 1+4 vs 2+3 groups", () => {
    const round = generateInitialMexicanoRound({
      entries: entries(8),
      courtCount: 2,
      targetPoints: 24,
      seed: "manual",
      firstRoundSeeding: "MANUAL",
    });
    expect(round.matches[0].sideA.entryIds).toEqual(["p1", "p4"]);
    expect(round.matches[0].sideB.entryIds).toEqual(["p2", "p3"]);
  });

  it("generates next round from current ranking", () => {
    const players = entries(8);
    const first = generateInitialMexicanoRound({
      entries: players,
      courtCount: 2,
      targetPoints: 24,
      seed: "mx",
      firstRoundSeeding: "MANUAL",
    });
    const next = generateNextMexicanoRound({
      entries: players,
      courtCount: 2,
      targetPoints: 24,
      seed: "mx",
      firstRoundSeeding: "MANUAL",
      priorRounds: [first],
      priorResults: first.matches.map((match) => ({ matchId: match.id, sideAScore: 16, sideBScore: 8 })),
    });
    expect(next.roundNumber).toBe(2);
    expect(next.matches).toHaveLength(2);
  });
});
