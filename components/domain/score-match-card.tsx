import { Save } from "lucide-react";
import { saveMatchScoreAction } from "@/app/competitions/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SocialEntry, SocialMatch } from "@/lib/competitions/social/social-types";

export function ScoreMatchCard({
  competitionId,
  entries,
  match,
}: {
  competitionId: string;
  entries: SocialEntry[];
  match: SocialMatch;
}) {
  const names = new Map(entries.map((entry) => [entry.id, entry.displayName]));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">{match.courtLabel}</p>
            <h3 className="font-semibold">Ronda {match.roundNumber}</h3>
          </div>
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900">
            Games objetivo {match.targetPoints}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <form action={saveMatchScoreAction} className="space-y-4">
          <input name="competitionId" type="hidden" value={competitionId} />
          <input name="matchId" type="hidden" value={match.id} />
          <ScoreSide
            inputName="sideAScore"
            names={match.sideA.entryIds.map((id) => names.get(id) ?? id)}
            score={match.sideA.score}
          />
          <div className="text-center text-xs font-semibold uppercase text-slate-400">vs</div>
          <ScoreSide
            inputName="sideBScore"
            names={match.sideB.entryIds.map((id) => names.get(id) ?? id)}
            score={match.sideB.score}
          />
          <Button className="w-full" type="submit">
            <Save size={16} />
            Guardar marcador
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ScoreSide({ inputName, names, score }: { inputName: string; names: string[]; score?: number }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_72px] items-center gap-3 rounded-md border border-emerald-950/10 p-3 sm:grid-cols-[minmax(0,1fr)_84px]">
      <div className="space-y-1">
        {names.map((name) => (
          <p className="break-words font-medium leading-tight" key={name}>
            {name}
          </p>
        ))}
      </div>
      <Input
        className="h-14 px-2 text-center text-xl font-bold"
        defaultValue={score ?? ""}
        inputMode="numeric"
        max={99}
        min={0}
        name={inputName}
        placeholder="Games"
        required
        type="number"
      />
    </div>
  );
}
