import { AppError } from "@/lib/validation/app-error";
import type { SocialEntry, SocialRound } from "@/lib/competitions/social/social-types";

export interface RoundPayload {
  id: string;
  matches: Array<{
    courtLabel: string;
    courtNumber: number;
    id: string;
    sideASeeds: number[];
    sideBSeeds: number[];
  }>;
  roundNumber: number;
  sitOutSeeds: number[];
}

/**
 * Contrato entre el dominio y SQL: las rondas viajan referenciando participantes
 * por `seed`, no por UUID, para que la creación quepa en una sola llamada
 * transaccional sin ida y vuelta para resolver identificadores.
 */
export function toRoundPayload(rounds: SocialRound[], entries: SocialEntry[]): RoundPayload[] {
  const seedById = new Map(entries.map((entry) => [entry.id, entry.seed]));
  const seedOf = (entryId: string) => {
    const seed = seedById.get(entryId);
    if (seed === undefined) {
      throw new AppError("engine_error", "Participante desconocido en el calendario.", 500);
    }
    return seed;
  };

  return rounds.map((round) => ({
    id: round.id,
    matches: round.matches.map((match) => ({
      courtLabel: match.courtLabel,
      courtNumber: match.courtNumber,
      id: match.id,
      sideASeeds: match.sideA.entryIds.map(seedOf),
      sideBSeeds: match.sideB.entryIds.map(seedOf),
    })),
    roundNumber: round.roundNumber,
    sitOutSeeds: round.sitOutEntryIds.map(seedOf),
  }));
}
