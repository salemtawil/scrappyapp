import { describe, expect, it } from "vitest";
import { createCourtHiveCompetitionRecord } from "@/lib/competitions/courthive/adapter";

describe("CourtHive adapter", () => {
  it("creates a round-robin doubles record and normalized projection", () => {
    const result = createCourtHiveCompetitionRecord({
      competitionId: "test-courthive",
      name: "Torneo Demo",
      format: "ROUND_ROBIN",
      pairs: Array.from({ length: 4 }, (_, index) => ({
        id: `pair-${index + 1}`,
        name: `Pareja ${index + 1}`,
        seed: index + 1,
        playerNames: [`A${index}`, `B${index}`],
      })),
    });
    expect(result.provider).toBe("courthive");
    expect(result.engineVersion).toBe("6.19.0");
    expect(result.matches.length).toBeGreaterThan(0);
  });
});
