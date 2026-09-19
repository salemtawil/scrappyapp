import { describe, expect, it } from "vitest";
import { generateAmericanoRounds } from "@/lib/competitions/social/americano";
import {
  canGenerateMexicanoNextRound,
  generateInitialMexicanoRound,
  generateNextMexicanoRound,
  roundsInvalidatedByHistoricalEdit,
  roundsSurvivingHistoricalEdit,
} from "@/lib/competitions/social/mexicano";
import { calculateSocialStandings } from "@/lib/competitions/social/standings";
import type { SocialScoring } from "@/lib/competitions/social/social-types";

const scoring: SocialScoring = { mode: "FIXED_TOTAL", targetPoints: 24 };

const entries = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    displayName: `Jugador ${index + 1}`,
    seed: index + 1,
    initialRating: index % 3 === 0 ? 4 - index / 100 : null,
  }));

describe("Generador de Americano", () => {
  for (const count of [4, 5, 6, 7, 8, 9, 12, 16, 20]) {
    it(`mantiene las invariantes de ronda con ${count} jugadores`, () => {
      const rounds = generateAmericanoRounds({
        entries: entries(count),
        courtCount: 2,
        roundCount: 4,
        scoring,
        seed: "same",
      });
      for (const round of rounds) {
        const players = round.matches.flatMap((match) => [
          ...match.sideA.entryIds,
          ...match.sideB.entryIds,
        ]);
        // Nadie puede estar dos veces en la misma ronda ni en los dos lados de un partido.
        expect(new Set(players).size).toBe(players.length);
        expect(round.matches.length).toBeLessThanOrEqual(2);
        expect(players.length + round.sitOutEntryIds.length).toBe(count);
        // Las pistas se numeran de forma única y correlativa.
        expect(round.matches.map((match) => match.courtNumber)).toEqual(
          round.matches.map((_, index) => index + 1),
        );
      }
    });
  }

  it("es reproducible con la misma semilla y cambia con otra", () => {
    const input = { courtCount: 2, entries: entries(8), roundCount: 6, scoring, seed: "det" };
    expect(generateAmericanoRounds(input)).toEqual(generateAmericanoRounds(input));
    expect(generateAmericanoRounds({ ...input, seed: "otra" })).not.toEqual(
      generateAmericanoRounds(input),
    );
  });

  it("reparte los descansos sin que nadie descanse dos veces más que otro", () => {
    const rounds = generateAmericanoRounds({
      entries: entries(9),
      courtCount: 2,
      roundCount: 9,
      scoring,
      seed: "rests",
    });
    const counts = new Map<string, number>();
    for (const round of rounds) {
      for (const id of round.sitOutEntryIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    expect(Math.max(...counts.values()) - Math.min(...counts.values())).toBeLessThanOrEqual(1);
  });

  it("no encadena descansos consecutivos cuando hay alternativa", () => {
    const rounds = generateAmericanoRounds({
      entries: entries(5),
      courtCount: 1,
      roundCount: 5,
      scoring,
      seed: "consecutive",
    });
    for (let index = 1; index < rounds.length; index += 1) {
      const previous = new Set(rounds[index - 1].sitOutEntryIds);
      const repeated = rounds[index].sitOutEntryIds.filter((id) => previous.has(id));
      expect(repeated).toHaveLength(0);
    }
  });

  it("evita repetir compañero mientras queden parejas nuevas", () => {
    const rounds = generateAmericanoRounds({
      entries: entries(8),
      courtCount: 2,
      roundCount: 3,
      scoring,
      seed: "partners",
    });
    const partnerships = rounds.flatMap((round) =>
      round.matches.flatMap((match) => [
        [...match.sideA.entryIds].sort().join("|"),
        [...match.sideB.entryIds].sort().join("|"),
      ]),
    );
    expect(new Set(partnerships).size).toBe(partnerships.length);
  });

  it("rechaza configuraciones imposibles", () => {
    expect(() =>
      generateAmericanoRounds({ entries: entries(3), courtCount: 1, roundCount: 1, scoring, seed: "x" }),
    ).toThrow();
    expect(() =>
      generateAmericanoRounds({ entries: entries(8), courtCount: 0, roundCount: 1, scoring, seed: "x" }),
    ).toThrow();
  });
});

describe("Generador de Mexicano", () => {
  it("empareja 1º+4º contra 2º+3º", () => {
    const round = generateInitialMexicanoRound({
      entries: entries(8),
      courtCount: 2,
      scoring,
      seed: "manual",
      firstRoundSeeding: "MANUAL",
    });
    expect(round.matches[0].sideA.entryIds).toEqual(["p1", "p4"]);
    expect(round.matches[0].sideB.entryIds).toEqual(["p2", "p3"]);
  });

  it("genera la siguiente ronda a partir de la clasificación", () => {
    const players = entries(8);
    const first = generateInitialMexicanoRound({
      entries: players,
      courtCount: 2,
      scoring,
      seed: "mx",
      firstRoundSeeding: "MANUAL",
    });
    const priorResults = first.matches.map((match) => ({
      matchId: match.id,
      sideAScore: 16,
      sideBScore: 8,
    }));
    const next = generateNextMexicanoRound({
      entries: players,
      courtCount: 2,
      scoring,
      seed: "mx",
      firstRoundSeeding: "MANUAL",
      priorRounds: [first],
      priorResults,
    });

    expect(next.roundNumber).toBe(2);
    expect(next.matches).toHaveLength(2);
    // Los cuatro primeros de la tabla comparten pista en la ronda siguiente.
    const leaders = calculateSocialStandings(players, [first], priorResults)
      .slice(0, 4)
      .map((row) => row.entryId);
    const firstCourt = [...next.matches[0].sideA.entryIds, ...next.matches[0].sideB.entryIds];
    expect(firstCourt.sort()).toEqual([...leaders].sort());
  });

  it("solo permite generar la ronda siguiente cuando la actual está completa", () => {
    const players = entries(8);
    const first = generateInitialMexicanoRound({
      entries: players,
      courtCount: 2,
      scoring,
      seed: "mx",
      firstRoundSeeding: "MANUAL",
    });
    expect(canGenerateMexicanoNextRound(first, [])).toBe(false);
    expect(
      canGenerateMexicanoNextRound(first, [
        { matchId: first.matches[0].id, sideAScore: 12, sideBScore: 12 },
      ]),
    ).toBe(false);
    expect(
      canGenerateMexicanoNextRound(
        first,
        first.matches.map((match) => ({ matchId: match.id, sideAScore: 12, sideBScore: 12 })),
      ),
    ).toBe(true);
  });

  it("al editar una ronda histórica conserva hasta esa ronda y descarta las posteriores", () => {
    const players = entries(8);
    let rounds = [
      generateInitialMexicanoRound({
        entries: players,
        courtCount: 2,
        scoring,
        seed: "hist",
        firstRoundSeeding: "MANUAL",
      }),
    ];
    for (let index = 0; index < 2; index += 1) {
      const priorResults = rounds.flatMap((round) =>
        round.matches.map((match) => ({ matchId: match.id, sideAScore: 14, sideBScore: 10 })),
      );
      rounds = [
        ...rounds,
        generateNextMexicanoRound({
          entries: players,
          courtCount: 2,
          scoring,
          seed: "hist",
          firstRoundSeeding: "MANUAL",
          priorRounds: rounds,
          priorResults,
        }),
      ];
    }

    expect(rounds).toHaveLength(3);
    expect(roundsSurvivingHistoricalEdit(rounds, 1).map((round) => round.roundNumber)).toEqual([1]);
    expect(roundsInvalidatedByHistoricalEdit(rounds, 1).map((round) => round.roundNumber)).toEqual([2, 3]);
    expect(roundsInvalidatedByHistoricalEdit(rounds, 3)).toHaveLength(0);
  });

  it("reparte los descansos cuando no todos caben en pista", () => {
    const players = entries(10);
    let rounds = [
      generateInitialMexicanoRound({
        entries: players,
        courtCount: 2,
        scoring,
        seed: "rest",
        firstRoundSeeding: "MANUAL",
      }),
    ];
    for (let index = 0; index < 4; index += 1) {
      const priorResults = rounds.flatMap((round) =>
        round.matches.map((match) => ({ matchId: match.id, sideAScore: 13, sideBScore: 11 })),
      );
      rounds = [
        ...rounds,
        generateNextMexicanoRound({
          entries: players,
          courtCount: 2,
          scoring,
          seed: "rest",
          firstRoundSeeding: "MANUAL",
          priorRounds: rounds,
          priorResults,
        }),
      ];
    }

    const counts = new Map(players.map((player) => [player.id, 0]));
    for (const round of rounds) {
      expect(round.sitOutEntryIds).toHaveLength(2);
      for (const id of round.sitOutEntryIds) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    expect(Math.max(...counts.values()) - Math.min(...counts.values())).toBeLessThanOrEqual(1);
  });
});
