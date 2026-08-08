import { describe, expect, it } from "vitest";
import { canChangeStructure, canCreateCompetition, canScoreCompetition } from "@/lib/competitions/permissions";

describe("permissions", () => {
  it("orders club roles", () => {
    expect(canCreateCompetition("organizer")).toBe(true);
    expect(canScoreCompetition("member")).toBe(false);
    expect(canChangeStructure("admin", "live")).toBe(false);
  });
});
