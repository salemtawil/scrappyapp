import { getAvailableFormat } from "@/lib/competitions/formats/registry";
import { parseMexicanoSettings, parseSocialSettings } from "@/lib/competitions/formats/settings";
import { socialMatchResult } from "@/lib/competitions/social/scoring";
import { calculateSocialStandings } from "@/lib/competitions/social/standings";
import type {
  SocialEntry,
  SocialResult,
  SocialRound,
} from "@/lib/competitions/social/social-types";
import type { CompetitionFormat } from "@/lib/competitions/types";
import type { SocialCompetitionView } from "./types";

interface AssembleInput {
  competition: SocialCompetitionView["competition"];
  format: CompetitionFormat;
  rawSettings: unknown;
  entries: SocialEntry[];
  rounds: SocialRound[];
  isDemo?: boolean;
}

/**
 * Punto único donde una competición social pasa de filas a vista de dominio.
 * Lo comparten la vista de organizador y la sala pública, así que la clasificación
 * y los estados derivados no se calculan dos veces con reglas distintas.
 */
export function assembleSocialCompetition(input: AssembleInput): SocialCompetitionView {
  const format = getAvailableFormat(input.format);
  const settings =
    input.format === "MEXICANO"
      ? parseMexicanoSettings(input.rawSettings)
      : parseSocialSettings(input.rawSettings);
  const scoring = { mode: settings.scoringMode, targetPoints: settings.targetPoints };
  const rounds = [...input.rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  const matches = rounds.flatMap((round) => round.matches);
  const results = matches
    .map(socialMatchResult)
    .filter((result): result is SocialResult => result !== null);
  const standings = calculateSocialStandings(input.entries, rounds, results, {
    ranking: format.ranking,
  });
  const completedMatches = matches.filter((match) => match.status === "completed").length;
  const firstUnfinished = rounds.find((round) =>
    round.matches.some((match) => match.status !== "completed"),
  );
  const lastRound = rounds.at(-1);
  const lastRoundComplete = Boolean(
    lastRound && lastRound.matches.length > 0 && lastRound.matches.every((m) => m.status === "completed"),
  );

  return {
    competition: input.competition,
    format,
    settings,
    scoring,
    entries: input.entries,
    rounds,
    results,
    standings,
    activeRoundNumber: firstUnfinished?.roundNumber ?? lastRound?.roundNumber ?? 1,
    completedMatches,
    totalMatches: matches.length,
    canGenerateNextRound:
      format.capabilities.dynamicRounds &&
      lastRoundComplete &&
      rounds.length < settings.roundCount,
    isDemo: input.isDemo ?? false,
  };
}
