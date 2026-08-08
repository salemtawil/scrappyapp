import type { ClubRole, CompetitionStatus } from "./types";

const roleWeight: Record<ClubRole, number> = {
  owner: 5,
  admin: 4,
  organizer: 3,
  scorer: 2,
  member: 1,
};

export function canManageClub(role?: ClubRole | null) {
  return Boolean(role && roleWeight[role] >= roleWeight.admin);
}

export function canCreateCompetition(role?: ClubRole | null) {
  return Boolean(role && roleWeight[role] >= roleWeight.organizer);
}

export function canScoreCompetition(role?: ClubRole | null) {
  return Boolean(role && roleWeight[role] >= roleWeight.scorer);
}

export function canChangeStructure(role: ClubRole | null | undefined, status: CompetitionStatus) {
  return canCreateCompetition(role) && ["draft", "registration", "ready"].includes(status);
}
