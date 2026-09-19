"use client";

import { ArrowLeft, ArrowRight, CalendarPlus, Check, Search } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { createCompetitionAction } from "@/app/competitions/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { listFormats, usableCourts } from "@/lib/competitions/formats/registry";
import { isAvailableFormat } from "@/lib/competitions/formats/types";
import { scoringModeHints, scoringModeLabels } from "@/lib/competitions/social/scoring";
import type { ScoringMode } from "@/lib/competitions/social/social-types";
import type { CompetitionFormat } from "@/lib/competitions/types";
import { getPlayerLevelLabel } from "@/lib/players/levels";
import { cn } from "@/lib/utils";
import { idleFormState } from "@/lib/validation/form-state";

export interface WizardPlayer {
  displayName: string;
  id: string;
  rating: number | null;
}

export interface WizardClub {
  id: string;
  name: string;
}

const steps = [
  "Tipo",
  "Detalles",
  "Puntuación",
  "Participantes",
  "Pistas",
  "Revisión",
] as const;

export function CreateCompetitionWizard({
  clubs,
  players,
}: {
  clubs: WizardClub[];
  players: WizardPlayer[];
}) {
  const [state, formAction] = useActionState(createCompetitionAction, idleFormState);
  const formats = useMemo(() => listFormats(), []);

  const [step, setStep] = useState(0);
  const [format, setFormat] = useState<CompetitionFormat>("AMERICANO");
  const [name, setName] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [clubId, setClubId] = useState("");
  const [scoringMode, setScoringMode] = useState<ScoringMode>("FIXED_TOTAL");
  const [targetPoints, setTargetPoints] = useState(24);
  const [seeding, setSeeding] = useState("RANDOM_SEEDED");
  const [selected, setSelected] = useState<string[]>(() => players.map((player) => player.id));
  const [query, setQuery] = useState("");
  const [courtCount, setCourtCount] = useState(() => Math.max(1, Math.floor(players.length / 4) || 1));
  const [roundCount, setRoundCount] = useState(() => Math.min(7, Math.max(1, players.length - 1)));
  const [stepError, setStepError] = useState<string | null>(null);

  const definition = formats.find((item) => item.format === format);
  const available = definition && isAvailableFormat(definition) ? definition : null;
  const entryCount = selected.length;
  const notices = available
    ? available.inspectSetup({ courtCount, entryCount, roundCount, scoring: { mode: scoringMode, targetPoints } })
    : [];
  const blocking = notices.filter((notice) => notice.level === "error");
  const filtered = players.filter((player) =>
    player.displayName.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const effectiveCourts = usableCourts(entryCount, courtCount);

  function toggle(playerId: string) {
    setSelected((current) =>
      current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId],
    );
  }

  function validateStep(index: number): string | null {
    if (index === 0 && !available) return "Elige un formato disponible para continuar.";
    if (index === 1 && name.trim().length === 0) return "Ponle nombre a la competición.";
    if (index === 2 && (targetPoints < 1 || targetPoints > 99)) return "Los games objetivo van de 1 a 99.";
    if (index === 3 && entryCount < 4) return "Selecciona al menos 4 jugadores.";
    if (index === 4 && courtCount < 1) return "Indica al menos una pista.";
    return null;
  }

  function goTo(next: number) {
    if (next > step) {
      for (let index = step; index < next; index += 1) {
        const error = validateStep(index);
        if (error) {
          setStep(index);
          setStepError(error);
          return;
        }
      }
    }
    setStepError(null);
    setStep(Math.min(Math.max(next, 0), steps.length - 1));
  }

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      <input name="format" type="hidden" value={format} />
      <input name="firstRoundSeeding" type="hidden" value={seeding} />

      <ol className="flex snap-x gap-2 overflow-x-auto pb-1" aria-label="Pasos">
        {steps.map((label, index) => {
          const isCurrent = index === step;
          const isDone = index < step;
          return (
            <li key={label}>
              <button
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex min-h-11 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-semibold",
                  isCurrent && "border-brand bg-brand text-white",
                  !isCurrent && isDone && "border-brand/30 bg-brand-soft text-brand-strong",
                  !isCurrent && !isDone && "border-line bg-surface text-muted-foreground",
                )}
                onClick={() => goTo(index)}
                type="button"
              >
                <span aria-hidden className="tabular">
                  {isDone ? <Check size={14} /> : index + 1}
                </span>
                {label}
              </button>
            </li>
          );
        })}
      </ol>

      {stepError && <Alert tone="warning">{stepError}</Alert>}
      {state.status === "error" && state.message && <Alert tone="error">{state.message}</Alert>}

      {/* Paso 1 — tipo */}
      <section aria-label="Tipo de competición" hidden={step !== 0} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {formats.filter(isAvailableFormat).map((item) => {
            const isSelected = item.format === format;
            return (
              <button
                aria-pressed={isSelected}
                className={cn(
                  "rounded-xl border p-4 text-left",
                  isSelected
                    ? "border-brand bg-brand-soft ring-1 ring-brand/30"
                    : "border-line bg-surface hover:bg-surface-muted",
                )}
                key={item.format}
                onClick={() => {
                  setFormat(item.format);
                  setScoringMode(item.defaultScoring.mode);
                  setTargetPoints(item.defaultScoring.targetPoints);
                  setStepError(null);
                }}
                type="button"
              >
                <p className="font-semibold text-foreground">{item.label}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.tagline}</p>
              </button>
            );
          })}
        </div>
        <details className="rounded-xl border border-dashed border-line bg-surface-muted/50 px-3 py-2">
          <summary className="cursor-pointer list-none py-1 text-sm font-semibold text-foreground">
            Formatos en preparación ({formats.length - formats.filter(isAvailableFormat).length})
          </summary>
          <ul className="mt-2 space-y-2 pb-1">
            {formats.filter((item) => !isAvailableFormat(item)).map((item) => (
              <li className="rounded-lg border border-line bg-surface p-3" key={item.format}>
                <p className="font-semibold text-foreground">{item.label}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.tagline}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {"plannedNote" in item ? item.plannedNote : null}
                </p>
              </li>
            ))}
          </ul>
        </details>
        {available && (
          <Alert title={`Cómo funciona un ${available.label}`} tone="info">
            <ul className="list-disc space-y-1 pl-4">
              {available.howItWorks.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Alert>
        )}
      </section>

      {/* Paso 2 — detalles */}
      <section aria-label="Detalles" hidden={step !== 1} className="grid gap-4 sm:grid-cols-2">
        <Field error={fieldErrors.name} htmlFor="name" label="Nombre">
          {(props) => (
            <Input
              {...props}
              name="name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Americano viernes noche"
              value={name}
            />
          )}
        </Field>
        <Field htmlFor="startsAt" label="Fecha y hora" optional>
          {(props) => (
            <Input
              {...props}
              name="startsAt"
              onChange={(event) => setStartsAt(event.target.value)}
              type="datetime-local"
              value={startsAt}
            />
          )}
        </Field>
        <Field
          className="sm:col-span-2"
          description="Agrupa la competición bajo una organización para que aparezca en su sala."
          htmlFor="clubId"
          label="Organización"
          optional
        >
          {(props) => (
            <Select {...props} name="clubId" onChange={(event) => setClubId(event.target.value)} value={clubId}>
              <option value="">Personal / sin organización</option>
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </section>

      {/* Paso 3 — puntuación */}
      <section aria-label="Puntuación" hidden={step !== 2} className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-foreground">Modo de puntuación</legend>
          {(available?.scoringModes ?? ["FIXED_TOTAL"]).map((mode) => (
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                scoringMode === mode ? "border-brand bg-brand-soft" : "border-line bg-surface",
              )}
              key={mode}
            >
              <input
                checked={scoringMode === mode}
                className="mt-1 size-4 accent-[var(--brand)]"
                name="scoringMode"
                onChange={() => setScoringMode(mode)}
                type="radio"
                value={mode}
              />
              <span>
                <span className="block font-semibold text-foreground">{scoringModeLabels[mode]}</span>
                <span className="block text-sm leading-6 text-muted-foreground">{scoringModeHints[mode]}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <Field
          description={
            scoringMode === "FIXED_TOTAL"
              ? "Cada partido reparte exactamente estos games entre las dos parejas."
              : "Tope de games que puede anotar cada pareja."
          }
          error={fieldErrors.targetPoints}
          htmlFor="targetPoints"
          label="Games objetivo"
        >
          {(props) => (
            <Input
              {...props}
              className="max-w-40"
              inputMode="numeric"
              max={99}
              min={1}
              name="targetPoints"
              onChange={(event) => setTargetPoints(Number(event.target.value))}
              type="number"
              value={targetPoints}
            />
          )}
        </Field>
        {format === "MEXICANO" && (
          <Field
            description="Cómo se ordena la primera ronda; a partir de la segunda manda la clasificación."
            htmlFor="seeding"
            label="Primera ronda"
          >
            {(props) => (
              <Select
                {...props}
                className="max-w-72"
                onChange={(event) => setSeeding(event.target.value)}
                value={seeding}
              >
                <option value="RANDOM_SEEDED">Sorteo</option>
                <option value="RATING">Por nivel</option>
                <option value="MANUAL">Por orden de la lista</option>
              </Select>
            )}
          </Field>
        )}
      </section>

      {/* Paso 4 — participantes */}
      <section aria-label="Participantes" hidden={step !== 3} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">
            {entryCount} de {players.length} seleccionados
          </p>
          <div className="flex gap-2">
            <Button onClick={() => setSelected(players.map((player) => player.id))} variant="secondary">
              Todos
            </Button>
            <Button onClick={() => setSelected([])} variant="secondary">
              Ninguno
            </Button>
          </div>
        </div>
        <Field htmlFor="playerSearch" label="Buscar jugador" optional>
          {(props) => (
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <Input
                {...props}
                className="pl-9"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nombre"
                type="search"
                value={query}
              />
            </div>
          )}
        </Field>
        {fieldErrors.playerIds && <Alert tone="error">{fieldErrors.playerIds}</Alert>}
        {fieldErrors.entries && <Alert tone="error">{fieldErrors.entries}</Alert>}
        <ul className="grid gap-2 sm:grid-cols-2">
          {filtered.map((player) => (
            <li key={player.id}>
              <label
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border p-3",
                  selected.includes(player.id) ? "border-brand bg-brand-soft" : "border-line bg-surface",
                )}
              >
                <input
                  checked={selected.includes(player.id)}
                  className="size-5 accent-[var(--brand)]"
                  name="playerIds"
                  onChange={() => toggle(player.id)}
                  type="checkbox"
                  value={player.id}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">{player.displayName}</span>
                  <span className="block text-xs text-muted-foreground">{getPlayerLevelLabel(player.rating)}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        {filtered.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">Ningún jugador coincide con “{query}”.</p>
        )}
      </section>

      {/* Paso 5 — pistas */}
      <section aria-label="Pistas" hidden={step !== 4} className="grid gap-4 sm:grid-cols-2">
        <Field
          description={`Con ${entryCount} jugadores se pueden llenar ${effectiveCourts} pista${effectiveCourts === 1 ? "" : "s"} por ronda.`}
          error={fieldErrors.courtCount}
          htmlFor="courtCount"
          label="Pistas disponibles"
        >
          {(props) => (
            <Input
              {...props}
              inputMode="numeric"
              max={16}
              min={1}
              name="courtCount"
              onChange={(event) => setCourtCount(Number(event.target.value))}
              type="number"
              value={courtCount}
            />
          )}
        </Field>
        <Field
          description={
            available?.rounds.fixedAtCreation
              ? "Se generan todas al crear la competición."
              : "Total previsto; se generan una a una según la clasificación."
          }
          error={fieldErrors.roundCount}
          htmlFor="roundCount"
          label="Rondas"
        >
          {(props) => (
            <Input
              {...props}
              inputMode="numeric"
              max={30}
              min={1}
              name="roundCount"
              onChange={(event) => setRoundCount(Number(event.target.value))}
              type="number"
              value={roundCount}
            />
          )}
        </Field>
      </section>

      {/* Paso 6 — revisión */}
      <section aria-label="Revisión" hidden={step !== 5} className="space-y-4">
        <dl className="grid gap-2 rounded-xl border border-line bg-surface p-4 sm:grid-cols-2">
          <Summary label="Formato" value={available?.label ?? "—"} />
          <Summary label="Nombre" value={name || "Sin nombre"} />
          <Summary label="Jugadores" value={String(entryCount)} />
          <Summary label="Pistas por ronda" value={String(effectiveCourts)} />
          <Summary
            label="Puntuación"
            value={`${scoringModeLabels[scoringMode]} · ${targetPoints} games`}
          />
          <Summary
            label="Rondas"
            value={
              available?.rounds.fixedAtCreation
                ? `${roundCount} generadas ahora`
                : `1 ahora, hasta ${roundCount}`
            }
          />
          <Summary label="Organización" value={clubs.find((club) => club.id === clubId)?.name ?? "Personal"} />
          <Summary label="Visibilidad" value="Pública con enlace y QR" />
        </dl>

        {notices.length > 0 && (
          <ul className="space-y-2">
            {notices.map((notice) => (
              <li key={`${notice.level}-${notice.message}`}>
                <Alert tone={notice.level === "error" ? "error" : notice.level === "warning" ? "warning" : "info"}>
                  {notice.message}
                </Alert>
              </li>
            ))}
          </ul>
        )}

        <SubmitButton
          className="w-full"
          disabled={blocking.length > 0 || entryCount < 4 || name.trim().length === 0}
          pendingLabel="Generando partidos…"
          size="lg"
        >
          <CalendarPlus size={18} />
          Crear y generar partidos
        </SubmitButton>
      </section>

      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <Button disabled={step === 0} onClick={() => goTo(step - 1)} variant="secondary">
          <ArrowLeft size={16} />
          Atrás
        </Button>
        {step < steps.length - 1 && (
          <Button onClick={() => goTo(step + 1)}>
            Siguiente
            <ArrowRight size={16} />
          </Button>
        )}
      </div>
    </form>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
