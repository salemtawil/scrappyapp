import { describe, expect, it } from "vitest";
import { generateLeagueSchedule } from "@/lib/competitions/league/schedule";
import { calculateLeagueStandings, validateSetScores } from "@/lib/competitions/league/standings";

const pairs = Array.from({ length: 4 }, (_, index) => ({
  id: `pair-${index + 1}`,
  name: `Pareja ${index + 1}`,
  seed: index + 1,
}));

describe("League schedule and standings", () => {
  it("generates single and double round robin fixtures", () => {
    expect(generateLeagueSchedule(pairs, 2, false).flat()).toHaveLength(6);
    expect(generateLeagueSchedule(pairs, 2, true).flat()).toHaveLength(12);
  });

  it("validates set scores", () => {
    expect(validateSetScores([{ a: 6, b: 4 }, { a: 7, b: 6 }])).toBeNull();
    expect(validateSetScores([{ a: 8, b: 7 }])).toContain("imposible");
  });

  it("calculates league points", () => {
    const fixtures = generateLeagueSchedule(pairs, 2, false).flat();
    const table = calculateLeagueStandings(pairs, fixtures, [
      { fixtureId: fixtures[0].id, sets: [{ a: 6, b: 3 }, { a: 6, b: 4 }] },
    ]);
    expect(table[0].leaguePoints).toBe(3);
  });
});
