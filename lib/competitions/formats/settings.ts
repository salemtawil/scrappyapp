import { z } from "zod";
import { MAX_TARGET_POINTS } from "@/lib/competitions/social/scoring";

export const scoringModeSchema = z.enum(["FIXED_TOTAL", "FREE_POINTS"]);
export const mexicanoSeedingSchema = z.enum(["RANDOM_SEEDED", "RATING", "MANUAL"]);

/** Ajustes persistidos en `competitions.settings` para los formatos sociales. */
export const socialSettingsSchema = z.object({
  courtCount: z.number().int().min(1).max(16),
  roundCount: z.number().int().min(1).max(30),
  targetPoints: z.number().int().min(1).max(MAX_TARGET_POINTS),
  scoringMode: scoringModeSchema,
  seed: z.string().min(1).max(64),
});

export const mexicanoSettingsSchema = socialSettingsSchema.extend({
  firstRoundSeeding: mexicanoSeedingSchema,
});

export type SocialSettings = z.infer<typeof socialSettingsSchema>;
export type MexicanoSettings = z.infer<typeof mexicanoSettingsSchema>;

/**
 * Lee `competitions.settings` con tolerancia: las competiciones creadas antes de que
 * existiera `scoringMode` se interpretan como suma fija, que es lo que hacían.
 */
export function parseSocialSettings(raw: unknown): SocialSettings {
  const source = (raw ?? {}) as Record<string, unknown>;
  const candidate = {
    courtCount: Number(source.courtCount ?? 1),
    roundCount: Number(source.roundCount ?? 1),
    targetPoints: Number(source.targetPoints ?? 24),
    scoringMode: source.scoringMode ?? "FIXED_TOTAL",
    seed: typeof source.seed === "string" && source.seed.length > 0 ? source.seed : "legacy",
  };
  const parsed = socialSettingsSchema.safeParse(candidate);
  if (parsed.success) return parsed.data;
  return {
    courtCount: 1,
    roundCount: 1,
    targetPoints: 24,
    scoringMode: "FIXED_TOTAL",
    seed: "legacy",
  };
}

export function parseMexicanoSettings(raw: unknown): MexicanoSettings {
  const base = parseSocialSettings(raw);
  const source = (raw ?? {}) as Record<string, unknown>;
  const seeding = mexicanoSeedingSchema.safeParse(source.firstRoundSeeding);
  return { ...base, firstRoundSeeding: seeding.success ? seeding.data : "RANDOM_SEEDED" };
}
