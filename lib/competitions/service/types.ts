import type { AvailableFormatDefinition } from "@/lib/competitions/formats/types";
import type { MexicanoSettings, SocialSettings } from "@/lib/competitions/formats/settings";
import type {
  SocialEntry,
  SocialResult,
  SocialRound,
  SocialScoring,
  SocialStanding,
} from "@/lib/competitions/social/social-types";
import type { CompetitionSummary } from "@/lib/competitions/types";

export interface CompetitionOrganization {
  name: string;
  slug: string;
}

export interface SocialCompetitionView {
  competition: CompetitionSummary & {
    stateVersion: number;
    organization: CompetitionOrganization | null;
  };
  format: AvailableFormatDefinition;
  settings: SocialSettings | MexicanoSettings;
  scoring: SocialScoring;
  entries: SocialEntry[];
  rounds: SocialRound[];
  results: SocialResult[];
  standings: SocialStanding[];
  /** Ronda con partidos pendientes más antigua; si todo está jugado, la última. */
  activeRoundNumber: number;
  completedMatches: number;
  totalMatches: number;
  /** Solo en formatos de rondas dinámicas y con la última ronda completa. */
  canGenerateNextRound: boolean;
  /** `true` cuando la vista viene de los datos de demostración, sin Supabase. */
  isDemo: boolean;
}
