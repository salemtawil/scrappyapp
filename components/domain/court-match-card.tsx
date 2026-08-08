import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { SocialEntry, SocialMatch } from "@/lib/competitions/social/social-types";

export function CourtMatchCard({
  match,
  entries,
  readonly = false,
}: {
  match: SocialMatch;
  entries: SocialEntry[];
  readonly?: boolean;
}) {
  const names = new Map(entries.map((entry) => [entry.id, entry.displayName]));
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">{match.courtLabel}</p>
          <h3 className="font-semibold">Ronda {match.roundNumber}</h3>
        </div>
        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900">
          Objetivo {match.targetPoints}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <Side names={match.sideA.entryIds.map((id) => names.get(id) ?? id)} score={match.sideA.score} />
        <div className="text-center text-xs font-semibold uppercase text-slate-400">vs</div>
        <Side names={match.sideB.entryIds.map((id) => names.get(id) ?? id)} score={match.sideB.score} />
        {!readonly && (
          <Button className="w-full" type="button">
            <Save size={16} />
            Guardar marcador
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function Side({ names, score }: { names: string[]; score?: number }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-emerald-950/10 p-3">
      <div className="space-y-1">
        {names.map((name) => (
          <p key={name} className="font-medium leading-tight">
            {name}
          </p>
        ))}
      </div>
      <div className="grid size-14 place-items-center rounded-md bg-slate-100 text-2xl font-bold">
        {score ?? "-"}
      </div>
    </div>
  );
}
