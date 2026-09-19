import { describe, expect, it } from "vitest";
import {
  competitionFormats,
  getAvailableFormat,
  hasBlockingNotices,
  listAvailableFormats,
  listFormats,
  usableCourts,
} from "@/lib/competitions/formats/registry";
import { isAvailableFormat } from "@/lib/competitions/formats/types";
import {
  parseMexicanoSettings,
  parseSocialSettings,
} from "@/lib/competitions/formats/settings";

const entries = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    displayName: `Jugador ${index + 1}`,
    id: `p${index + 1}`,
    initialRating: null,
    seed: index + 1,
  }));

const scoring = { mode: "FIXED_TOTAL", targetPoints: 24 } as const;

describe("Registro de formatos", () => {
  it("cubre todos los formatos del esquema", () => {
    const formats = listFormats();
    expect(formats).toHaveLength(8);
    for (const format of formats) {
      expect(format.label.length).toBeGreaterThan(0);
      expect(format.tagline.length).toBeGreaterThan(0);
      expect(format.howItWorks.length).toBeGreaterThan(0);
      expect(competitionFormats[format.format]).toBe(format);
    }
  });

  it("solo declara disponibles los formatos que saben generar calendario", () => {
    for (const format of listAvailableFormats()) {
      expect(typeof format.generateInitialRounds).toBe("function");
      if (format.capabilities.dynamicRounds) {
        expect(typeof format.generateNextRound).toBe("function");
      }
      expect(format.rounds.fixedAtCreation).toBe(!format.capabilities.dynamicRounds);
    }
  });

  it("los formatos en preparación no se pueden usar por error", () => {
    const planned = listFormats().filter((format) => !isAvailableFormat(format));
    expect(planned.length).toBeGreaterThan(0);
    for (const format of planned) {
      expect(() => getAvailableFormat(format.format)).toThrow();
    }
  });

  it("limita las pistas a las que se pueden llenar", () => {
    expect(usableCourts(8, 4)).toBe(2);
    expect(usableCourts(4, 4)).toBe(1);
    expect(usableCourts(20, 3)).toBe(3);
    expect(usableCourts(2, 4)).toBe(1);
  });

  it("bloquea configuraciones imposibles y avisa de las dudosas", () => {
    const americano = getAvailableFormat("AMERICANO");
    const tooFew = americano.inspectSetup({ courtCount: 1, entryCount: 3, roundCount: 3, scoring });
    expect(hasBlockingNotices(tooFew)).toBe(true);

    const fine = americano.inspectSetup({ courtCount: 2, entryCount: 8, roundCount: 5, scoring });
    expect(hasBlockingNotices(fine)).toBe(false);

    const tooManyRounds = americano.inspectSetup({ courtCount: 2, entryCount: 8, roundCount: 12, scoring });
    expect(tooManyRounds.some((notice) => notice.level === "warning" && notice.field === "roundCount")).toBe(true);

    const extraCourts = americano.inspectSetup({ courtCount: 6, entryCount: 8, roundCount: 4, scoring });
    expect(extraCourts.some((notice) => notice.field === "courtCount")).toBe(true);

    const resting = americano.inspectSetup({ courtCount: 1, entryCount: 6, roundCount: 4, scoring });
    expect(resting.some((notice) => notice.message.includes("descansará"))).toBe(true);
  });

  it("Americano genera todo el calendario y Mexicano solo la primera ronda", () => {
    const americano = getAvailableFormat("AMERICANO");
    const mexicano = getAvailableFormat("MEXICANO");
    const input = { courtCount: 2, entries: entries(8), roundCount: 4, scoring, seed: "fmt" };

    expect(americano.generateInitialRounds(input)).toHaveLength(4);
    expect(mexicano.generateInitialRounds({ ...input, firstRoundSeeding: "MANUAL" })).toHaveLength(1);
  });
});

describe("Lectura de ajustes persistidos", () => {
  it("interpreta como suma fija las competiciones creadas antes del modo de puntuación", () => {
    const legacy = parseSocialSettings({ courtCount: 2, roundCount: 5, targetPoints: 24, seed: "ABC123" });
    expect(legacy.scoringMode).toBe("FIXED_TOTAL");
    expect(legacy.seed).toBe("ABC123");
    expect(legacy.courtCount).toBe(2);
  });

  it("no revienta con ajustes corruptos o vacíos", () => {
    expect(parseSocialSettings(null).targetPoints).toBe(24);
    expect(parseSocialSettings({ courtCount: "muchas" }).courtCount).toBe(1);
    expect(parseSocialSettings({ targetPoints: 500 }).targetPoints).toBe(24);
  });

  it("da un sorteo por defecto al Mexicano sin configuración de primera ronda", () => {
    expect(parseMexicanoSettings({}).firstRoundSeeding).toBe("RANDOM_SEEDED");
    expect(parseMexicanoSettings({ firstRoundSeeding: "RATING" }).firstRoundSeeding).toBe("RATING");
    expect(parseMexicanoSettings({ firstRoundSeeding: "loquesea" }).firstRoundSeeding).toBe("RANDOM_SEEDED");
  });
});
