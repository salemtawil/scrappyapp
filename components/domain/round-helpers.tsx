import { Coffee } from "lucide-react";
import type { RoundTab } from "@/components/domain/round-tabs";
import type { SocialEntry } from "@/lib/competitions/social/social-types";
import type { SocialCompetitionView } from "@/lib/competitions/service/types";

export function roundTabsFor(data: SocialCompetitionView) {
  const tabs: RoundTab[] = data.rounds.map((round) => {
    const pending = round.matches.filter((match) => match.status !== "completed").length;
    return {
      hint: pending === 0 ? "completa" : `${pending} pendiente${pending === 1 ? "" : "s"}`,
      id: round.id,
      label: `Ronda ${round.roundNumber}`,
      tone: pending === 0 ? ("done" as const) : ("pending" as const),
    };
  });
  const activeIndex = Math.max(
    0,
    data.rounds.findIndex((round) => round.roundNumber === data.activeRoundNumber),
  );
  return { activeIndex, tabs };
}

export function SitOutNote({
  entries,
  sitOutEntryIds,
}: {
  entries: SocialEntry[];
  sitOutEntryIds: string[];
}) {
  if (sitOutEntryIds.length === 0) return null;
  const names = new Map(entries.map((entry) => [entry.id, entry.displayName]));

  return (
    <p className="flex items-center gap-2 rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm text-muted-foreground">
      <Coffee aria-hidden size={16} />
      <span>
        <span className="font-semibold text-foreground">Descansan:</span>{" "}
        {sitOutEntryIds.map((id) => names.get(id) ?? "—").join(", ")}
      </span>
    </p>
  );
}
