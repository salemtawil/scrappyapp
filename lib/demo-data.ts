import { generateAmericanoRounds } from "./competitions/social/americano";
import type { SocialScoring } from "./competitions/social/social-types";

/**
 * Datos de demostración. Solo se usan cuando Supabase NO está configurado,
 * para que la portada, el panel y la sala de ejemplo se puedan recorrer en local.
 * Con Supabase configurado no se sirven nunca.
 */
export const DEMO_ROOM_CODE = "PADEL8";

const demoScoring: SocialScoring = { mode: "FIXED_TOTAL", targetPoints: 24 };

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
  initialRating: index % 3,
}));

const demoRounds = generateAmericanoRounds({
  entries: demoEntries,
  courtCount: 2,
  roundCount: 3,
  scoring: demoScoring,
  seed: "demo",
});

const demoScores = new Map<string, [number, number]>([
  [demoRounds[0].matches[0].id, [14, 10]],
  [demoRounds[0].matches[1].id, [11, 13]],
  [demoRounds[1].matches[0].id, [12, 12]],
]);

/** Mismo contrato que devuelve `public_competition_snapshot` en Postgres. */
export function demoPublicSnapshot() {
  const refOf = (entryId: string) =>
    `e${demoEntries.find((entry) => entry.id === entryId)?.seed ?? 0}`;

  return {
    competition: {
      category: "SOCIAL" as const,
      format: "AMERICANO" as const,
      name: "Americano Viernes Noche (demo)",
      organization: null,
      plannedRounds: demoRounds.length,
      roomCode: DEMO_ROOM_CODE,
      scoringMode: demoScoring.mode,
      startsAt: new Date().toISOString(),
      stateVersion: 1,
      status: "live" as const,
      targetPoints: demoScoring.targetPoints,
      timezone: "America/Caracas",
    },
    participants: demoEntries.map((entry) => ({
      name: entry.displayName,
      ref: `e${entry.seed}`,
      seed: entry.seed,
    })),
    rounds: demoRounds.map((round) => ({
      matches: round.matches.map((match) => {
        const score = demoScores.get(match.id);
        return {
          courtLabel: match.courtLabel,
          courtNumber: match.courtNumber,
          ref: match.id,
          sideARefs: match.sideA.entryIds.map(refOf),
          sideAScore: score?.[0] ?? null,
          sideBRefs: match.sideB.entryIds.map(refOf),
          sideBScore: score?.[1] ?? null,
          status: (score ? "completed" : "pending") as "completed" | "pending",
        };
      }),
      roundNumber: round.roundNumber,
      sitOutRefs: round.sitOutEntryIds.map(refOf),
    })),
  };
}

export const demoDashboardCompetition = {
  completedMatches: demoScores.size,
  format: "AMERICANO" as const,
  name: "Americano Viernes Noche (demo)",
  pendingMatches: demoRounds.flatMap((round) => round.matches).length - demoScores.size,
  playerCount: demoEntries.length,
  roomCode: DEMO_ROOM_CODE,
  status: "live" as const,
};
