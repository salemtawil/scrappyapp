import { cn } from "@/lib/utils";
import { MatchStatusBadge } from "@/components/domain/badges";
import type { SocialEntry, SocialMatch } from "@/lib/competitions/social/social-types";

export function nameMap(entries: SocialEntry[]) {
  return new Map(entries.map((entry) => [entry.id, entry.displayName]));
}

export function MatchCard({
  entries,
  match,
  emphasis = false,
}: {
  emphasis?: boolean;
  entries: SocialEntry[];
  match: SocialMatch;
}) {
  const names = nameMap(entries);
  const sideAWins = isWinner(match.sideA.score, match.sideB.score);
  const sideBWins = isWinner(match.sideB.score, match.sideA.score);

  return (
    <article
      className={cn(
        "rounded-xl border bg-surface p-3 shadow-sm",
        match.status === "completed" ? "border-line" : "border-brand/30",
        emphasis && "ring-1 ring-brand/20",
      )}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{match.courtLabel}</p>
        <MatchStatusBadge status={match.status} />
      </header>
      <MatchSide
        names={match.sideA.entryIds.map((id) => names.get(id) ?? "—")}
        score={match.sideA.score}
        winner={sideAWins}
      />
      <p className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">vs</p>
      <MatchSide
        names={match.sideB.entryIds.map((id) => names.get(id) ?? "—")}
        score={match.sideB.score}
        winner={sideBWins}
      />
    </article>
  );
}

function isWinner(own: number | undefined, other: number | undefined) {
  return own !== undefined && other !== undefined && own > other;
}

function MatchSide({
  names,
  score,
  winner,
}: {
  names: string[];
  score?: number;
  winner: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border px-3 py-2",
        winner ? "border-brand/40 bg-brand-soft" : "border-line bg-surface",
      )}
    >
      <div className="min-w-0">
        {names.map((name) => (
          <p className="truncate text-sm font-medium text-foreground" key={name}>
            {name}
          </p>
        ))}
      </div>
      <span
        className={cn(
          "tabular grid size-11 place-items-center rounded-lg text-xl font-bold",
          score === undefined ? "bg-surface-muted text-muted-foreground" : "bg-foreground text-white",
        )}
      >
        {score ?? "–"}
      </span>
    </div>
  );
}
