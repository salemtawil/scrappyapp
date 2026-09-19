import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { NextRoundButton } from "@/components/domain/next-round-button";
import { RoundTabs } from "@/components/domain/round-tabs";
import { roundTabsFor, SitOutNote } from "@/components/domain/round-helpers";
import { ScoreEntryCard } from "@/components/domain/score-entry-card";
import { StandingsTable } from "@/components/domain/standings-table";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminSession } from "@/lib/auth/admin";
import { requireOwnedCompetition } from "@/lib/competitions/service/queries";

export const metadata: Metadata = { title: "Marcadores en vivo" };

export default async function LiveConsolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, admin] = await Promise.all([requireOwnedCompetition(id), getAdminSession()]);
  const { tabs, activeIndex } = roundTabsFor(data);
  const canScore = admin.isAdmin;

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">Marcadores</h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">{data.competition.name}</p>
          </div>
          <Link href={`/competitions/${data.competition.id}`}>
            <Button className="w-full sm:w-auto" variant="secondary">
              <BarChart3 size={16} />
              Ver tabla
            </Button>
          </Link>
        </div>

        {!canScore && (
          <Alert className="mt-4" title="Solo lectura" tone="warning">
            Tu correo no está autorizado para guardar marcadores, así que esta consola se muestra sin
            controles de edición.
          </Alert>
        )}

        <div className="mt-5">
          <RoundTabs defaultIndex={activeIndex} tabs={tabs}>
            {data.rounds.map((round) => (
              <div className="space-y-3" key={round.id}>
                <SitOutNote entries={data.entries} sitOutEntryIds={round.sitOutEntryIds} />
                {round.roundNumber < data.activeRoundNumber && (
                  <Alert tone="info">
                    Esta ronda ya está cerrada. Puedes corregir un resultado, pero
                    {data.format.capabilities.dynamicRounds
                      ? " se te pedirá confirmación porque invalidará las rondas posteriores."
                      : " la clasificación se recalculará al guardar."}
                  </Alert>
                )}
                {round.matches.map((match) =>
                  canScore ? (
                    <ScoreEntryCard
                      competitionId={data.competition.id}
                      entries={data.entries}
                      key={match.id}
                      match={match}
                      scoring={data.scoring}
                    />
                  ) : null,
                )}
              </div>
            ))}
          </RoundTabs>
        </div>

        {canScore && data.format.capabilities.dynamicRounds && (
          <Card className="mt-5">
            <CardContent>
              <NextRoundButton
                competitionId={data.competition.id}
                disabledReason={data.canGenerateNextRound ? undefined : "Completa la ronda actual para emparejar la siguiente."}
                formatLabel={data.format.label}
              />
            </CardContent>
          </Card>
        )}

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Clasificación</CardTitle>
          </CardHeader>
          <CardContent>
            <StandingsTable ranking={data.format.ranking} standings={data.standings} />
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
