import { z } from "zod";

export const competitionNameSchema = z.string().min(1).max(100);
export const playerDisplayNameSchema = z.string().min(1).max(80);

export const socialSettingsSchema = z.object({
  courtCount: z.number().int().min(1).max(16),
  targetPoints: z.number().int().min(1).max(24),
  roundCount: z.number().int().min(1).max(100).optional(),
  openEnded: z.boolean().default(false),
  seed: z.string().min(1),
});

export const createCompetitionSchema = z.object({
  name: competitionNameSchema,
  format: z.enum(["AMERICANO", "MEXICANO", "ROUND_ROBIN", "SINGLE_ELIMINATION"]),
  visibility: z.enum(["public", "private"]).default("public"),
  startsAt: z.string(),
  timezone: z.string().min(1),
});
