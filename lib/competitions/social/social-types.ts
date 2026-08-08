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
  courtLabel: string;
  sideA: SocialSide;
  sideB: SocialSide;
  targetPoints: number;
  stateVersion: number;
}

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
}

export interface GenerateSocialInput {
  entries: SocialEntry[];
  courtCount: number;
  roundCount?: number;
  targetPoints: number;
  seed: string;
  priorRounds?: SocialRound[];
  priorResults?: SocialResult[];
}
