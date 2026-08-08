import type { CompetitionFormat } from "../types";

export interface CourtHivePairInput {
  id: string;
  name: string;
  seed: number;
  playerNames: [string, string];
}

export interface NormalizedTournamentMatch {
  id: string;
  engineMatchupId?: string;
  roundName: string;
  sideA: string;
  sideB: string;
  winnerSide?: "A" | "B";
}

export interface CourtHiveAdapterResult {
  provider: "courthive";
  engineVersion: string;
  engineRecord: unknown;
  matches: NormalizedTournamentMatch[];
  supportedFormat: CompetitionFormat;
}
