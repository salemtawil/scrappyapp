import "server-only";
import {
  drawDefinitionConstants,
  eventConstants,
  tournamentEngine,
  version as factoryVersion,
} from "tods-competition-factory";
import type { CompetitionFormat } from "../types";
import { generateLeagueSchedule } from "../league/schedule";
import type { CourtHiveAdapterResult, CourtHivePairInput } from "./types";

const supportedDraws: Partial<Record<CompetitionFormat, string>> = {
  ROUND_ROBIN: drawDefinitionConstants.ROUND_ROBIN,
  SINGLE_ELIMINATION: drawDefinitionConstants.SINGLE_ELIMINATION,
  DOUBLE_ELIMINATION: drawDefinitionConstants.DOUBLE_ELIMINATION,
  GROUPS_PLAYOFF: drawDefinitionConstants.ROUND_ROBIN_WITH_PLAYOFF,
};

export function createCourtHiveCompetitionRecord(params: {
  competitionId: string;
  name: string;
  format: CompetitionFormat;
  pairs: CourtHivePairInput[];
}): CourtHiveAdapterResult {
  const drawType = supportedDraws[params.format];
  if (!drawType) throw new Error(`Unsupported CourtHive format: ${params.format}`);

  tournamentEngine.reset();
  const startDate = new Date().toISOString().slice(0, 10);
  const recordResult = tournamentEngine.newTournamentRecord({
    tournamentName: params.name,
    tournamentId: params.competitionId,
    startDate,
  });
  if (recordResult.error) throw new Error(String(recordResult.error.message ?? recordResult.error));

  const state = tournamentEngine.getTournament() as { tournamentRecord?: unknown };
  const tournamentRecord = state.tournamentRecord;
  const drawResult = tournamentEngine.generateEventWithDraw({
    tournamentRecord,
    drawProfile: {
      eventName: params.name,
      eventType: eventConstants.DOUBLES,
      drawType,
      drawSize: params.pairs.length,
      participantsCount: params.pairs.length,
      seedsCount: Math.min(params.pairs.length, 8),
    },
  });
  if (drawResult.error) throw new Error(String(drawResult.error.message ?? drawResult.error));

  const engineRecord = (tournamentEngine.getTournament() as { tournamentRecord?: unknown }).tournamentRecord;
  const projected = projectFallbackMatches(params.format, params.pairs);
  return {
    provider: "courthive",
    engineVersion: String(factoryVersion()),
    engineRecord,
    matches: projected,
    supportedFormat: params.format,
  };
}

function projectFallbackMatches(format: CompetitionFormat, pairs: CourtHivePairInput[]) {
  if (format === "ROUND_ROBIN" || format === "GROUPS_PLAYOFF") {
    return generateLeagueSchedule(
      pairs.map((pair) => ({ id: pair.id, name: pair.name, seed: pair.seed })),
      16,
    )
      .flat()
      .map((fixture) => ({
        id: fixture.id,
        roundName: `Ronda ${fixture.roundNumber}`,
        sideA: pairs.find((pair) => pair.id === fixture.homePairId)?.name ?? "Pareja A",
        sideB: pairs.find((pair) => pair.id === fixture.awayPairId)?.name ?? "Pareja B",
      }));
  }
  const ordered = [...pairs].sort((a, b) => a.seed - b.seed);
  const matches = [];
  for (let index = 0; index < ordered.length; index += 2) {
    if (ordered[index + 1]) {
      matches.push({
        id: `bracket-r1-m${matches.length + 1}`,
        roundName: "Ronda 1",
        sideA: ordered[index].name,
        sideB: ordered[index + 1].name,
      });
    }
  }
  return matches;
}
