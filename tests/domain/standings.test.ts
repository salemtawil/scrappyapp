import { describe, expect, it } from "vitest";
import { calculateSocialStandings, headToHeadDelta } from "@/lib/competitions/social/standings";
import type { SocialRound } from "@/lib/competitions/social/social-types";

const players = ["a", "b", "c", "d"].map((id, index) => ({
  displayName: id.toUpperCase(),
  id,
  seed: index + 1,
  initialRating: null,
}));

function round(number: number, sideA: [string, string], sideB: [string, string]): SocialRound {
  return {
    id: `r${number}`,
    matches: [
      {
        courtLabel: "Pista 1",
        courtNumber: 1,
        id: `r${number}-m1`,
        roundNumber: number,
        scoringMode: "FIXED_TOTAL",
        sideA: { entryIds: sideA },
        sideB: { entryIds: sideB },
        stateVersion: 0,
        status: "completed",
        targetPoints: 24,
      },
    ],
    roundNumber: number,
    sitOutEntryIds: [],
  };
}

describe("Clasificación social", () => {
  it("acumula games, victorias, diferencia y descansos", () => {
    const rounds = [round(1, ["a", "b"], ["c", "d"])];
    const table = calculateSocialStandings(players, rounds, [
      { matchId: "r1-m1", sideAScore: 15, sideBScore: 9 },
    ]);

    expect(table[0].pointsFor).toBe(15);
    expect(table[0].wins).toBe(1);
    expect(table[0].pointDiff).toBe(6);
    expect(table.at(-1)?.losses).toBe(1);
    expect(table.at(-1)?.pointDiff).toBe(-6);
  });

  it("cuenta los descansos de cada ronda", () => {
    const rounds = [{ ...round(1, ["a", "b"], ["c", "d"]), sitOutEntryIds: ["a"] }];
    const table = calculateSocialStandings(players, rounds, []);
    expect(table.find((row) => row.entryId === "a")?.sitOuts).toBe(1);
  });

  it("ignora los partidos sin resultado", () => {
    const table = calculateSocialStandings(players, [round(1, ["a", "b"], ["c", "d"])], []);
    expect(table.every((row) => row.played === 0)).toBe(true);
  });

  it("registra el enfrentamiento directo y lo usa para desempatar", () => {
    // A y C empatan a games; A ganó su duelo directo contra C.
    const rounds = [round(1, ["a", "x"], ["c", "y"])];
    const contenders = [
      { displayName: "A", id: "a", initialRating: null, seed: 1 },
      { displayName: "C", id: "c", initialRating: null, seed: 2 },
      { displayName: "X", id: "x", initialRating: null, seed: 3 },
      { displayName: "Y", id: "y", initialRating: null, seed: 4 },
    ];
    const table = calculateSocialStandings(contenders, rounds, [
      { matchId: "r1-m1", sideAScore: 13, sideBScore: 11 },
    ]);
    const a = table.find((row) => row.entryId === "a")!;
    const c = table.find((row) => row.entryId === "c")!;

    expect(a.headToHead.c).toBe(1);
    expect(c.headToHead.a).toBe(-1);
    expect(headToHeadDelta(a, c)).toBe(2);
    expect(table[0].entryId).toBe("a");
  });

  it("ordena por victorias cuando el formato lo pide", () => {
    // A suma muchos más games (46) pero gana menos partidos (1) que B (26 games, 2 victorias).
    const contenders = [
      { displayName: "Muchos games", id: "a", initialRating: null, seed: 1 },
      { displayName: "Mas victorias", id: "b", initialRating: null, seed: 2 },
      { displayName: "Relleno 1", id: "x", initialRating: null, seed: 3 },
      { displayName: "Relleno 2", id: "y", initialRating: null, seed: 4 },
    ];
    const rounds = [
      round(1, ["a", "x"], ["b", "y"]),
      round(2, ["b", "x"], ["a", "y"]),
      round(3, ["b", "x"], ["a", "y"]),
    ];
    const results = [
      { matchId: "r1-m1", sideAScore: 24, sideBScore: 0 },
      { matchId: "r2-m1", sideAScore: 13, sideBScore: 11 },
      { matchId: "r3-m1", sideAScore: 13, sideBScore: 11 },
    ];

    const byPoints = calculateSocialStandings(contenders, rounds, results).map((row) => row.entryId);
    const byWins = calculateSocialStandings(contenders, rounds, results, {
      ranking: "WINS_FIRST",
    }).map((row) => row.entryId);

    expect(byPoints.indexOf("a")).toBeLessThan(byPoints.indexOf("b"));
    expect(byWins.indexOf("b")).toBeLessThan(byWins.indexOf("a"));
  });

  it("usa el seed como último desempate para que el orden sea estable", () => {
    const table = calculateSocialStandings(players, [], []);
    expect(table.map((row) => row.entryId)).toEqual(["a", "b", "c", "d"]);
  });
});
