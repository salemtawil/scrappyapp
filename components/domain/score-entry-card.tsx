"use client";

import { Save } from "lucide-react";
import { useActionState, useState } from "react";
import { saveMatchScoreAction } from "@/app/competitions/actions";
import { MatchStatusBadge } from "@/components/domain/badges";
import { nameMap } from "@/components/domain/match-card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  complementaryScore,
  validateSocialScore,
} from "@/lib/competitions/social/scoring";
import type { SocialEntry, SocialMatch, SocialScoring } from "@/lib/competitions/social/social-types";
import { cn } from "@/lib/utils";
import { idleFormState } from "@/lib/validation/form-state";

export function ScoreEntryCard({
  competitionId,
  entries,
  match,
  scoring,
}: {
  competitionId: string;
  entries: SocialEntry[];
  match: SocialMatch;
  scoring: SocialScoring;
}) {
  const [state, formAction] = useActionState(saveMatchScoreAction, idleFormState);
  const names = nameMap(entries);
  const [sideA, setSideA] = useState(match.sideA.score?.toString() ?? "");
  const [sideB, setSideB] = useState(match.sideB.score?.toString() ?? "");

  const parsedA = Number.parseInt(sideA, 10);
  const parsedB = Number.parseInt(sideB, 10);
  const bothFilled = Number.isInteger(parsedA) && Number.isInteger(parsedB);
  // Misma función que valida el servidor: la regla no se escribe dos veces.
  const liveError = bothFilled ? validateSocialScore(parsedA, parsedB, scoring) : null;

  function updateSide(side: "A" | "B", raw: string) {
    const value = raw.replace(/[^\d]/g, "").slice(0, 2);
    if (side === "A") {
      setSideA(value);
      const mirrored = value === "" ? null : complementaryScore(Number.parseInt(value, 10), scoring);
      if (mirrored !== null) setSideB(String(mirrored));
      return;
    }
    setSideB(value);
    const mirrored = value === "" ? null : complementaryScore(Number.parseInt(value, 10), scoring);
    if (mirrored !== null) setSideA(String(mirrored));
  }

  return (
    <article
      className={cn(
        "rounded-xl border bg-surface p-3 shadow-sm",
        state.status === "error" ? "border-danger/40" : "border-line",
      )}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{match.courtLabel}</p>
          <p className="text-xs text-muted-foreground">
            {scoring.mode === "FIXED_TOTAL"
              ? `Suma ${scoring.targetPoints} games`
              : `Hasta ${scoring.targetPoints} games`}
          </p>
        </div>
        <MatchStatusBadge status={match.status} />
      </header>

      <form action={formAction} className="space-y-3">
        <input name="competitionId" type="hidden" value={competitionId} />
        <input name="matchId" type="hidden" value={match.id} />
        <input name="expectedStateVersion" type="hidden" value={match.stateVersion} />

        <ScoreSide
          id={`${match.id}-a`}
          invalid={Boolean(liveError)}
          names={match.sideA.entryIds.map((id) => names.get(id) ?? "—")}
          onChange={(value) => updateSide("A", value)}
          inputName="sideAScore"
          value={sideA}
        />
        <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">vs</p>
        <ScoreSide
          id={`${match.id}-b`}
          invalid={Boolean(liveError)}
          names={match.sideB.entryIds.map((id) => names.get(id) ?? "—")}
          onChange={(value) => updateSide("B", value)}
          inputName="sideBScore"
          value={sideB}
        />

        {scoring.mode === "FIXED_TOTAL" && (
          <div className="flex flex-wrap gap-2">
            {quickScores(scoring.targetPoints).map((value) => (
              <Button
                className="h-9 px-3 text-xs"
                key={value}
                onClick={() => updateSide("A", String(value))}
                variant="secondary"
              >
                {value}–{scoring.targetPoints - value}
              </Button>
            ))}
          </div>
        )}

        {liveError && (
          <Alert tone="warning">
            <p>{liveError}</p>
          </Alert>
        )}
        {state.status === "error" && state.message && <Alert tone="error">{state.message}</Alert>}
        {state.status === "success" && state.message && <Alert tone="success">{state.message}</Alert>}
        {state.status === "confirm" && (
          <Alert title="Esto borrará rondas ya generadas" tone="warning">
            <p>{state.message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <SubmitButton
                className="h-10"
                name="confirmCascade"
                pendingLabel="Aplicando…"
                value="true"
                variant="danger"
              >
                Sí, corregir igualmente
              </SubmitButton>
            </div>
          </Alert>
        )}

        <SubmitButton className="w-full" disabled={Boolean(liveError) || !bothFilled} size="lg">
          <Save size={18} />
          {match.status === "completed" ? "Actualizar marcador" : "Guardar marcador"}
        </SubmitButton>
      </form>
    </article>
  );
}

/** Marcadores más frecuentes del objetivo elegido, para no teclear en mitad del partido. */
function quickScores(targetPoints: number) {
  const half = Math.floor(targetPoints / 2);
  const candidates = [targetPoints, targetPoints - 2, half + 1, half, targetPoints - half - 1];
  return [...new Set(candidates)].filter((value) => value >= 0 && value <= targetPoints).slice(0, 5);
}

function ScoreSide({
  id,
  inputName,
  invalid,
  names,
  onChange,
  value,
}: {
  id: string;
  inputName: string;
  invalid: boolean;
  names: string[];
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_88px] items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2">
      <label className="min-w-0" htmlFor={id}>
        {names.map((name) => (
          <span className="block truncate text-sm font-medium text-foreground" key={name}>
            {name}
          </span>
        ))}
      </label>
      <Input
        aria-invalid={invalid || undefined}
        aria-label={`Games de ${names.join(" y ")}`}
        autoComplete="off"
        className="tabular h-14 px-2 text-center text-2xl font-bold"
        id={id}
        inputMode="numeric"
        name={inputName}
        onChange={(event) => onChange(event.target.value)}
        pattern="[0-9]*"
        placeholder="–"
        required
        value={value}
      />
    </div>
  );
}
