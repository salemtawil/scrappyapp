export type CompetitionCategory = "SOCIAL" | "TOURNAMENT" | "LEAGUE";

export type CompetitionFormat =
  | "AMERICANO"
  | "MEXICANO"
  | "ROUND_ROBIN"
  | "SINGLE_ELIMINATION"
  | "DOUBLE_ELIMINATION"
  | "GROUPS_PLAYOFF"
  | "SINGLE_ROUND_ROBIN"
  | "DOUBLE_ROUND_ROBIN";

export type CompetitionStatus =
  | "draft"
  | "registration"
  | "ready"
  | "live"
  | "finished"
  | "cancelled";

export type Visibility = "public" | "private";
export type EngineProvider = "custom" | "courthive";

export type ClubRole = "owner" | "admin" | "organizer" | "scorer" | "member";

export interface CompetitionSummary {
  id: string;
  name: string;
  category: CompetitionCategory;
  format: CompetitionFormat;
  status: CompetitionStatus;
  visibility: Visibility;
  roomCode: string;
  startsAt: string;
  timezone: string;
}
