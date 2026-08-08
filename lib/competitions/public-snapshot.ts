import { demoCompetition, demoEntries, demoRounds, demoStandings } from "@/lib/demo-data";

export function getPublicCompetitionSnapshot(roomCode: string) {
  return {
    competition: {
      id: demoCompetition.id,
      name: demoCompetition.name,
      category: demoCompetition.category,
      format: demoCompetition.format,
      status: demoCompetition.status,
      startsAt: demoCompetition.startsAt,
      timezone: demoCompetition.timezone,
      roomCode,
    },
    participants: demoEntries.map((entry) => ({
      id: entry.id,
      displayName: entry.displayName,
    })),
    currentRound: demoRounds[0],
    recentRounds: demoRounds,
    standings: demoStandings,
  };
}
