import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { scoringModeLabels } from "@/lib/competitions/social/scoring";
import { requireOwnedCompetition } from "@/lib/competitions/service/queries";
import { getActivityLog } from "@/lib/competitions/service/activity";

export const metadata: Metadata = { title: "Configuración" };

const actionLabels: Record<string, string> = {
  "competition.created": "Competición creada",
  "match.scored": "Marcador guardado",
  "round.generated": "Ronda generada",
  "round.invalidated_by_edit": "Rondas eliminadas por una corrección",
  "round.replaced": "Rondas reemplazadas",
};

export default async function CompetitionSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await requireOwnedCompetition(id);
  const log = await getActivityLog(id);

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Configuración</h1>
        <p className="mt-1 truncate text-muted-foreground">{data.competition.name}</p>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Reglas de esta competición</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Row label="Formato" value={data.format.label} />
              <Row label="Puntuación" value={`${scoringModeLabels[data.scoring.mode]} · ${data.scoring.targetPoints} games`} />
              <Row label="Pistas por ronda" value={String(data.settings.courtCount)} />
              <Row
                label="Rondas"
                value={`${data.rounds.length} de ${data.settings.roundCount} previstas`}
              />
              <Row label="Desempate" value={data.format.ranking === "WINS_FIRST" ? "Victorias, luego games" : "Games, luego victorias"} />
              <Row label="Código de sala" value={data.competition.roomCode} />
            </dl>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
              {data.format.howItWorks.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {data.format.capabilities.dynamicRounds && (
          <Alert className="mt-5" title="Corregir un resultado antiguo" tone="warning">
            En {data.format.label} los emparejamientos salen de la clasificación, así que corregir el
            resultado de una ronda cerrada elimina las rondas posteriores y sus marcadores. La consola de
            marcadores pide confirmación y dice cuántas rondas y resultados se perderían antes de aplicarlo.
          </Alert>
        )}

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Registro de actividad</CardTitle>
          </CardHeader>
          <CardContent>
            {log.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Todavía no hay movimientos.</p>
            ) : (
              <ol className="space-y-2">
                {log.map((entry) => (
                  <li className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/70 pb-2 last:border-0" key={entry.id}>
                    <span className="text-sm font-medium text-foreground">
                      {actionLabels[entry.action] ?? entry.action}
                    </span>
                    <time className="text-xs text-muted-foreground" dateTime={entry.createdAt}>
                      {new Date(entry.createdAt).toLocaleString("es", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: data.competition.timezone,
                      })}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <div className="mt-5">
          <Link href={`/competitions/${data.competition.id}`}>
            <Button variant="secondary">Volver a la competición</Button>
          </Link>
        </div>
      </main>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
