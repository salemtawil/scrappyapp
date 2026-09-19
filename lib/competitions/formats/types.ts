import type { ZodType } from "zod";
import type { StandingsRanking } from "@/lib/competitions/social/standings";
import type {
  ScoringMode,
  SocialEntry,
  SocialResult,
  SocialRound,
  SocialScoring,
} from "@/lib/competitions/social/social-types";
import type { CompetitionCategory, CompetitionFormat } from "@/lib/competitions/types";

export type FormatAvailability = "available" | "planned";

export interface ParticipantRequirements {
  /** Qué se inscribe: jugadores sueltos o parejas/equipos fijos. */
  subject: "player" | "pair";
  min: number;
  max: number;
  /** Si está presente, la cantidad de participantes debe ser múltiplo de este número. */
  multipleOf?: number;
}

export interface RoundRequirements {
  min: number;
  max: number;
  /**
   * `true` cuando todo el calendario se genera al crear la competición.
   * `false` cuando las rondas se van generando a partir de la clasificación.
   */
  fixedAtCreation: boolean;
}

export interface FormatCapabilities {
  dynamicRounds: boolean;
  groups: boolean;
  playoffs: boolean;
}

export interface FormatSetupInput {
  entryCount: number;
  courtCount: number;
  roundCount: number;
  scoring: SocialScoring;
}

export type FormatNoticeLevel = "info" | "warning" | "error";

export interface FormatNotice {
  level: FormatNoticeLevel;
  /** Campo del formulario al que pertenece el aviso, para poder mostrarlo junto a él. */
  field?: "entries" | "courtCount" | "roundCount" | "targetPoints" | "scoringMode";
  message: string;
}

export interface GenerateInitialInput {
  entries: SocialEntry[];
  courtCount: number;
  roundCount: number;
  scoring: SocialScoring;
  seed: string;
  /** Solo lo usan los formatos que ordenan la primera ronda (Mexicano). */
  firstRoundSeeding?: "RANDOM_SEEDED" | "RATING" | "MANUAL";
}

export interface GenerateNextInput extends GenerateInitialInput {
  priorRounds: SocialRound[];
  priorResults: SocialResult[];
}

interface BaseFormatDefinition {
  category: CompetitionCategory;
  format: CompetitionFormat;
  label: string;
  tagline: string;
  /** Explicación corta que la UI muestra antes de generar nada. */
  howItWorks: string[];
}

export interface PlannedFormatDefinition extends BaseFormatDefinition {
  availability: "planned";
  /** Qué falta para habilitarlo. Se muestra tal cual, sin prometer fechas. */
  plannedNote: string;
}

export interface AvailableFormatDefinition<TSettings = unknown> extends BaseFormatDefinition {
  availability: "available";
  participants: ParticipantRequirements;
  rounds: RoundRequirements;
  courts: { min: number; max: number };
  scoringModes: ScoringMode[];
  defaultScoring: SocialScoring;
  ranking: StandingsRanking;
  capabilities: FormatCapabilities;
  settingsSchema: ZodType<TSettings>;
  /** Avisos y errores propios del formato, calculados sobre la configuración elegida. */
  inspectSetup(input: FormatSetupInput): FormatNotice[];
  generateInitialRounds(input: GenerateInitialInput): SocialRound[];
  /** Solo en formatos de rondas dinámicas. */
  generateNextRound?(input: GenerateNextInput): SocialRound;
}

export type CompetitionFormatDefinition<TSettings = unknown> =
  | AvailableFormatDefinition<TSettings>
  | PlannedFormatDefinition;

export function isAvailableFormat<T>(
  definition: CompetitionFormatDefinition<T>,
): definition is AvailableFormatDefinition<T> {
  return definition.availability === "available";
}
