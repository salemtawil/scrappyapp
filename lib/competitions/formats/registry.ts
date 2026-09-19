import { generateAmericanoRounds } from "@/lib/competitions/social/americano";
import {
  generateInitialMexicanoRound,
  generateNextMexicanoRound,
} from "@/lib/competitions/social/mexicano";
import { MAX_TARGET_POINTS } from "@/lib/competitions/social/scoring";
import type { CompetitionFormat } from "@/lib/competitions/types";
import { mexicanoSettingsSchema, socialSettingsSchema } from "./settings";
import type {
  AvailableFormatDefinition,
  CompetitionFormatDefinition,
  FormatNotice,
  FormatSetupInput,
} from "./types";
import { isAvailableFormat } from "./types";

const MIN_PLAYERS = 4;
const MAX_PLAYERS = 64;

/** Pistas que realmente se pueden usar: cada partido de dobles ocupa cuatro jugadores. */
export function usableCourts(entryCount: number, courtCount: number) {
  return Math.max(1, Math.min(courtCount, Math.floor(entryCount / 4)));
}

function sharedSocialNotices(input: FormatSetupInput): FormatNotice[] {
  const notices: FormatNotice[] = [];
  const { entryCount, courtCount, scoring } = input;

  if (entryCount < MIN_PLAYERS) {
    notices.push({
      level: "error",
      field: "entries",
      message: `Necesitas al menos ${MIN_PLAYERS} jugadores para armar un partido de dobles.`,
    });
  }
  if (entryCount > MAX_PLAYERS) {
    notices.push({
      level: "error",
      field: "entries",
      message: `El máximo es ${MAX_PLAYERS} jugadores por competición.`,
    });
  }

  const usable = usableCourts(entryCount, courtCount);
  if (entryCount >= MIN_PLAYERS && usable < courtCount) {
    notices.push({
      level: "warning",
      field: "courtCount",
      message: `Con ${entryCount} jugadores solo se pueden llenar ${usable} pista${usable === 1 ? "" : "s"} por ronda.`,
    });
  }

  const resting = entryCount >= MIN_PLAYERS ? entryCount - usable * 4 : 0;
  if (resting > 0) {
    notices.push({
      level: "info",
      field: "entries",
      message: `${resting} jugador${resting === 1 ? "" : "es"} descansará${resting === 1 ? "" : "n"} cada ronda. Los descansos se reparten de forma pareja y se evita descansar dos rondas seguidas.`,
    });
  }

  if (scoring.mode === "FIXED_TOTAL" && scoring.targetPoints % 2 !== 0) {
    notices.push({
      level: "info",
      field: "targetPoints",
      message: "Con un objetivo impar no puede haber empates: siempre habrá ganador.",
    });
  }
  if (scoring.targetPoints > MAX_TARGET_POINTS) {
    notices.push({
      level: "error",
      field: "targetPoints",
      message: `El objetivo máximo es ${MAX_TARGET_POINTS} games.`,
    });
  }

  return notices;
}

const americano: AvailableFormatDefinition = {
  availability: "available",
  category: "SOCIAL",
  format: "AMERICANO",
  label: "Americano",
  tagline: "Parejas rotativas, games acumulados por jugador.",
  howItWorks: [
    "Cada ronda mezcla las parejas buscando que nadie repita compañero ni rival.",
    "Todo el calendario se genera al crear la competición.",
    "Gana quien más games suma al final, no quien más partidos gana.",
  ],
  participants: { subject: "player", min: MIN_PLAYERS, max: MAX_PLAYERS },
  rounds: { min: 1, max: 30, fixedAtCreation: true },
  courts: { min: 1, max: 16 },
  scoringModes: ["FIXED_TOTAL", "FREE_POINTS"],
  defaultScoring: { mode: "FIXED_TOTAL", targetPoints: 24 },
  ranking: "POINTS_FIRST",
  capabilities: { dynamicRounds: false, groups: false, playoffs: false },
  settingsSchema: socialSettingsSchema,
  inspectSetup(input) {
    const notices = sharedSocialNotices(input);
    const usable = usableCourts(input.entryCount, input.courtCount);
    const maxDistinctPartners = input.entryCount - 1;
    if (input.entryCount >= MIN_PLAYERS && input.roundCount > maxDistinctPartners) {
      notices.push({
        level: "warning",
        field: "roundCount",
        message: `Con ${input.entryCount} jugadores solo hay ${maxDistinctPartners} compañeros distintos: a partir de la ronda ${maxDistinctPartners + 1} se empezarán a repetir parejas.`,
      });
    }
    if (input.entryCount >= MIN_PLAYERS && usable * 4 < input.entryCount && input.roundCount < Math.ceil(input.entryCount / (usable * 4))) {
      notices.push({
        level: "warning",
        field: "roundCount",
        message: "Con tan pocas rondas habrá jugadores que no lleguen a jugar ninguna.",
      });
    }
    return notices;
  },
  generateInitialRounds(input) {
    return generateAmericanoRounds({
      entries: input.entries,
      courtCount: input.courtCount,
      roundCount: input.roundCount,
      scoring: input.scoring,
      seed: input.seed,
    });
  },
};

const mexicano: AvailableFormatDefinition = {
  availability: "available",
  category: "SOCIAL",
  format: "MEXICANO",
  label: "Mexicano",
  tagline: "Cada ronda se arma con la clasificación en vivo.",
  howItWorks: [
    "La primera ronda se sortea (o se ordena por nivel) y las siguientes se generan con la tabla.",
    "En cada pista juegan 1º+4º contra 2º+3º, así los partidos salen parejos.",
    "Solo se genera la siguiente ronda cuando la actual está completa.",
  ],
  participants: { subject: "player", min: MIN_PLAYERS, max: MAX_PLAYERS },
  rounds: { min: 1, max: 30, fixedAtCreation: false },
  courts: { min: 1, max: 16 },
  scoringModes: ["FIXED_TOTAL", "FREE_POINTS"],
  defaultScoring: { mode: "FIXED_TOTAL", targetPoints: 24 },
  ranking: "POINTS_FIRST",
  capabilities: { dynamicRounds: true, groups: false, playoffs: false },
  settingsSchema: mexicanoSettingsSchema,
  inspectSetup(input) {
    const notices = sharedSocialNotices(input);
    notices.push({
      level: "info",
      field: "roundCount",
      message: "Se creará solo la primera ronda; el resto se generan a medida que cargas resultados.",
    });
    if (input.entryCount % 4 !== 0 && input.entryCount >= MIN_PLAYERS) {
      notices.push({
        level: "info",
        field: "entries",
        message: "Con un número que no es múltiplo de 4, el reparto de descansos prioriza a quien menos ha descansado.",
      });
    }
    return notices;
  },
  generateInitialRounds(input) {
    return [
      generateInitialMexicanoRound({
        entries: input.entries,
        courtCount: input.courtCount,
        scoring: input.scoring,
        seed: input.seed,
        firstRoundSeeding: input.firstRoundSeeding ?? "RANDOM_SEEDED",
      }),
    ];
  },
  generateNextRound(input) {
    return generateNextMexicanoRound({
      entries: input.entries,
      courtCount: input.courtCount,
      scoring: input.scoring,
      seed: input.seed,
      firstRoundSeeding: input.firstRoundSeeding ?? "RANDOM_SEEDED",
      priorRounds: input.priorRounds,
      priorResults: input.priorResults,
    });
  },
};

export const competitionFormats: Record<CompetitionFormat, CompetitionFormatDefinition> = {
  AMERICANO: americano,
  MEXICANO: mexicano,
  SINGLE_ROUND_ROBIN: {
    availability: "planned",
    category: "LEAGUE",
    format: "SINGLE_ROUND_ROBIN",
    label: "Liga (ida)",
    tagline: "Parejas fijas, calendario por jornadas y tabla por sets.",
    howItWorks: ["Cada pareja juega una vez contra todas las demás."],
    plannedNote: "El calendario y la tabla ya existen en el dominio; falta la inscripción de parejas y la carga por sets.",
  },
  DOUBLE_ROUND_ROBIN: {
    availability: "planned",
    category: "LEAGUE",
    format: "DOUBLE_ROUND_ROBIN",
    label: "Liga (ida y vuelta)",
    tagline: "Como la liga de ida, con la vuelta invertida.",
    howItWorks: ["Cada pareja juega dos veces contra todas las demás."],
    plannedNote: "Depende de la inscripción de parejas y de la carga por sets.",
  },
  ROUND_ROBIN: {
    availability: "planned",
    category: "TOURNAMENT",
    format: "ROUND_ROBIN",
    label: "Todos contra todos",
    tagline: "Grupo único de parejas con clasificación final.",
    howItWorks: ["Todas las parejas se enfrentan entre sí."],
    plannedNote: "Requiere el motor de torneos y la vista de cuadro.",
  },
  GROUPS_PLAYOFF: {
    availability: "planned",
    category: "TOURNAMENT",
    format: "GROUPS_PLAYOFF",
    label: "Grupos + playoff",
    tagline: "Fase de grupos y cuadro final con los clasificados.",
    howItWorks: ["Round robin por grupo y eliminatoria con los mejores."],
    plannedNote: "Requiere grupos, cuadro con byes y avance automático del ganador.",
  },
  SINGLE_ELIMINATION: {
    availability: "planned",
    category: "TOURNAMENT",
    format: "SINGLE_ELIMINATION",
    label: "Eliminación simple",
    tagline: "Cuadro directo: quien pierde, queda fuera.",
    howItWorks: ["Los ganadores avanzan ronda a ronda hasta la final."],
    plannedNote: "Requiere la vista de cuadro con byes y propagación de ganadores.",
  },
  DOUBLE_ELIMINATION: {
    availability: "planned",
    category: "TOURNAMENT",
    format: "DOUBLE_ELIMINATION",
    label: "Eliminación doble",
    tagline: "Cuadro con repesca: hace falta perder dos veces.",
    howItWorks: ["Cada pareja tiene una segunda oportunidad en el cuadro de perdedores."],
    plannedNote: "Requiere la vista de cuadro y el cruce entre ambos lados.",
  },
};

export function getFormatDefinition(format: CompetitionFormat) {
  return competitionFormats[format];
}

export function getAvailableFormat(format: CompetitionFormat): AvailableFormatDefinition {
  const definition = competitionFormats[format];
  if (!isAvailableFormat(definition)) {
    throw new Error(`El formato ${format} todavía no está disponible.`);
  }
  return definition;
}

export function listFormats() {
  return Object.values(competitionFormats);
}

export function listAvailableFormats(): AvailableFormatDefinition[] {
  return listFormats().filter(isAvailableFormat);
}

export function hasBlockingNotices(notices: FormatNotice[]) {
  return notices.some((notice) => notice.level === "error");
}

export { isAvailableFormat };
