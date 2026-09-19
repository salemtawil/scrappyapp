export type ScoringMode = "FIXED_TOTAL" | "FREE_POINTS";

/**
 * Configuración de puntuación de una competición social.
 * - FIXED_TOTAL: cada partido reparte exactamente `targetPoints` games entre los dos lados.
 * - FREE_POINTS: cada lado anota libremente hasta `targetPoints`.
 */
export interface SocialScoring {
  mode: ScoringMode;
  targetPoints: number;
}

export interface SocialEntry {
  id: string;
  displayName: string;
  seed: number;
  initialRating?: number | null;
}

export interface SocialSide {
  entryIds: [string, string];
  score?: number;
}

export interface SocialMatch {
  id: string;
  roundNumber: number;
  courtNumber: number;
  courtLabel: string;
  sideA: SocialSide;
  sideB: SocialSide;
  targetPoints: number;
  scoringMode: ScoringMode;
  status: MatchState;
  stateVersion: number;
}

export type MatchState = "pending" | "completed" | "void";

export interface SocialRound {
  id: string;
  roundNumber: number;
  matches: SocialMatch[];
  sitOutEntryIds: string[];
}

export interface SocialResult {
  matchId: string;
  sideAScore: number;
  sideBScore: number;
}

export interface SocialStanding {
  entryId: string;
  displayName: string;
  seed: number;
  played: number;
  wins: number;
  ties: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  sitOuts: number;
  /** Saldo de enfrentamientos directos: +1 por rival batido, -1 por rival que le ganó. */
  headToHead: Record<string, number>;
}

export interface GenerateSocialInput {
  entries: SocialEntry[];
  courtCount: number;
  roundCount?: number;
  scoring: SocialScoring;
  seed: string;
  priorRounds?: SocialRound[];
  priorResults?: SocialResult[];
}
