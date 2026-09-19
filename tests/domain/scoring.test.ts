import { describe, expect, it } from "vitest";
import {
  complementaryScore,
  validateFixedTotalScore,
  validateSocialScore,
  winnerSideOf,
} from "@/lib/competitions/social/scoring";

describe("Validación de marcadores", () => {
  const fixed = { mode: "FIXED_TOTAL", targetPoints: 24 } as const;
  const free = { mode: "FREE_POINTS", targetPoints: 32 } as const;

  it("exige que la suma fija cuadre exactamente", () => {
    expect(validateSocialScore(12, 12, fixed)).toBeNull();
    expect(validateSocialScore(24, 0, fixed)).toBeNull();
    expect(validateSocialScore(13, 12, fixed)).toContain("24");
    expect(validateSocialScore(11, 12, fixed)).toContain("24");
  });

  it("rechaza valores no enteros o negativos en cualquier modo", () => {
    expect(validateSocialScore(12.5, 11.5, fixed)).toContain("enteros");
    expect(validateSocialScore(-1, 25, fixed)).toContain("negativos");
    expect(validateSocialScore(-1, 5, free)).toContain("negativos");
  });

  it("en puntos libres respeta el tope y exige que se haya jugado", () => {
    expect(validateSocialScore(20, 14, free)).toBeNull();
    expect(validateSocialScore(33, 14, free)).toContain("32");
    expect(validateSocialScore(0, 0, free)).toContain("al menos un game");
    expect(validateSocialScore(1, 0, free)).toBeNull();
  });

  it("calcula el marcador complementario solo en suma fija", () => {
    expect(complementaryScore(15, fixed)).toBe(9);
    expect(complementaryScore(0, fixed)).toBe(24);
    expect(complementaryScore(25, fixed)).toBeNull();
    expect(complementaryScore(15, free)).toBeNull();
  });

  it("resuelve el ganador y el empate", () => {
    expect(winnerSideOf(15, 9)).toBe("A");
    expect(winnerSideOf(9, 15)).toBe("B");
    expect(winnerSideOf(12, 12)).toBeNull();
  });

  it("mantiene la función previa de suma fija", () => {
    expect(validateFixedTotalScore(12, 12, 24)).toBeNull();
    expect(validateFixedTotalScore(13, 12, 24)).toContain("24");
  });
});
