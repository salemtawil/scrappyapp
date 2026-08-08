import { generateAmericanoRounds } from "./competitions/social/americano";
import { calculateSocialStandings } from "./competitions/social/standings";
import type { CompetitionSummary } from "./competitions/types";

export const demoEntries = [
  "Ana Ruiz",
  "Carlos Vega",
  "Laura Martín",
  "Diego Soto",
  "Marta Gil",
  "Pablo León",
  "Irene Casas",
  "Hugo Silva",
].map((displayName, index) => ({
  id: `p${index + 1}`,
  displayName,
  seed: index + 1,
  initialRating: 3 + index / 10,
}));

export const demoCompetition: CompetitionSummary = {
  id: "demo-americano",
  name: "Americano Viernes Noche",
  category: "SOCIAL",
  format: "AMERICANO",
  status: "live",
  visibility: "public",
  roomCode: "PADEL8",
  startsAt: new Date().toISOString(),
  timezone: "Europe/Madrid",
};

export const demoRounds = generateAmericanoRounds({
  entries: demoEntries,
  courtCount: 2,
  roundCount: 3,
  targetPoints: 24,
  seed: "demo",
});

export const demoResults = demoRounds[0].matches.map((match, index) => ({
  matchId: match.id,
  sideAScore: index === 0 ? 14 : 11,
  sideBScore: index === 0 ? 10 : 13,
}));

export const demoStandings = calculateSocialStandings(demoEntries, demoRounds, demoResults);
