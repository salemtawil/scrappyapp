export const playerLevels = [
  { label: "Rookie (novato)", value: 0 },
  { label: "7ma", value: 1 },
  { label: "6ta", value: 2 },
  { label: "5ta", value: 3 },
  { label: "4ta", value: 4 },
  { label: "3ra", value: 5 },
  { label: "2da", value: 6 },
  { label: "1ra", value: 7 },
  { label: "Master", value: 8 },
  { label: "Open", value: 9 },
] as const;

export const playerLevelValues: readonly number[] = playerLevels.map((level) => level.value);

export function getPlayerLevelLabel(value: number | null) {
  if (value === null) return "Sin nivel";

  return playerLevels.find((level) => level.value === value)?.label ?? `Nivel ${value}`;
}
