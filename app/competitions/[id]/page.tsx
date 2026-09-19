import type { Metadata } from "next";
import Link from "next/link";
import { Download, ListOrdered, Radio, Settings2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CompetitionStatusBadge, FormatBadge } from "@/components/domain/badges";
import { MatchCard } from "@/components/domain/match-card";
import { NextRoundButton } from "@/components/domain/next-round-button";
import { RoundTabs } from "@/components/domain/round-tabs";
import { ShareCompetitionDialog } from "@/components/domain/share-dialog";
import { StandingsTable } from "@/components/domain/standings-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireOwnedCompetition } from "@/lib/competitions/service/queries";
import { absoluteUrl } from "@/lib/utils";
import { roundTabsFor, SitOutNote } from "@/components/domain/round-helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await requireOwnedCompetition(id);
  return { title: data.competition.name };
}

export default async function CompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await requireOwnedCompetition(id);
  const { tabs, activeIndex } = roundTabsFor(data);
  const progress = data.totalMatches === 0 ? 0 : Math.round((data.completedMatches / data.totalMatches) * 100);

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{data.competition.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <FormatBadge format={data.competition.format} />
              <CompetitionStatusBadge status={data.competition.status} />
              {data.competition.organization && (
                <Link
                  className="text-sm font-semibold text-brand-strong underline underline-offset-2"
                  href={`/clubs/${data.competition.organization.slug}`}
                >
                  {data.competition.organization.name}
                </Link>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {data.completedMatches} de {data.totalMatches} partidos cargados · {data.entries.length} jugadores
            </p>
          </div>
          <div className="grid gap-2 sm:flex">
            <Link href={`/competitions/${data.competition.id}/live`}>
              <Button className="w-full" size="lg">
                <ListOrdered size={18} />
                Cargar marcadores
              </Button>
            </Link>
            <Link href={`/r/${data.competition.roomCode}`}>
              <Button className="w-full" variant="secondary">
                <Radio size={16} />
                Sala pública
              </Button>
            </Link>
          </div>
        </div>

        <div
          aria-label={`Progreso: ${progress}%`}
          className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted"
          role="img"
        >
          <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section aria-labelledby="partidos" className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground" id="partidos">
              Partidos
            </h2>
            {data.rounds.length === 0 ? (
              <EmptyState
                description="Todavía no se generó ninguna ronda para esta competición."
                title="Sin rondas"
              />
            ) : (
              <RoundTabs defaultIndex={activeIndex} tabs={tabs}>
                {data.rounds.map((round) => (
                  <div className="space-y-3" key={round.id}>
                    <SitOutNote entries={data.entries} sitOutEntryIds={round.sitOutEntryIds} />
                    <div className="grid gap-3 md:grid-cols-2">
                      {round.matches.map((match) => (
                        <MatchCard entries={data.entries} key={match.id} match={match} />
                      ))}
                    </div>
                  </div>
                ))}
              </RoundTabs>
            )}
            {data.format.capabilities.dynamicRounds && (
              <Card>
                <CardContent>
                  <NextRoundButton
                    competitionId={data.competition.id}
                    disabledReason={nextRoundReason(data)}
                    formatLabel={data.format.label}
                  />
                </CardContent>
              </Card>
            )}
          </section>

          <aside className="space-y-4">
            <ShareCompetitionDialog
              roomCode={data.competition.roomCode}
              url={absoluteUrl(`/r/${data.competition.roomCode}`)}
            />
            <Card>
              <CardHeader className="flex items-center justify-between gap-2">
                <CardTitle>Clasificación</CardTitle>
                <a
                  className="inline-flex items-center gap-1 text-sm font-semibold text-brand-strong underline underline-offset-2"
                  href={`/api/competitions/${data.competition.id}/export`}
                >
                  <Download aria-hidden size={14} />
                  CSV
                </a>
              </CardHeader>
              <CardContent>
                <StandingsTable ranking={data.format.ranking} standings={data.standings} />
              </CardContent>
            </Card>
            <Link href={`/competitions/${data.competition.id}/settings`}>
              <Button className="w-full" variant="secondary">
                <Settings2 size={16} />
                Configuración y registro
              </Button>
            </Link>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

function nextRoundReason(data: Awaited<ReturnType<typeof requireOwnedCompetition>>) {
  if (data.canGenerateNextRound) return undefined;
  const lastRound = data.rounds.at(-1);
  const pending = lastRound?.matches.filter((match) => match.status !== "completed").length ?? 0;
  if (pending > 0) {
    return `Faltan ${pending} marcador${pending === 1 ? "" : "es"} de la ronda ${lastRound?.roundNumber} para emparejar la siguiente.`;
  }
  if (data.rounds.length >= data.settings.roundCount) {
    return `Ya se jugaron las ${data.settings.roundCount} rondas previstas.`;
  }
  return "Todavía no se puede generar la siguiente ronda.";
}
