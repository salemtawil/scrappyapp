import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MonitorPlay } from "lucide-react";
import { CompetitionStatusBadge, FormatBadge } from "@/components/domain/badges";
import { MatchCard } from "@/components/domain/match-card";
import { RoundTabs } from "@/components/domain/round-tabs";
import { roundTabsFor, SitOutNote } from "@/components/domain/round-helpers";
import { StandingsTable } from "@/components/domain/standings-table";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicCompetition } from "@/lib/competitions/service/queries";

// La sala pública se consulta en vivo: no debe servirse desde caché estática.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}): Promise<Metadata> {
  const { roomCode } = await params;
  const data = await getPublicCompetition(roomCode);
  return { title: data ? data.competition.name : "Sala no encontrada" };
}

export default async function PublicRoomPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  const data = await getPublicCompetition(roomCode);

  if (!data) notFound();

  const { tabs, activeIndex } = roundTabsFor(data);

  return (
    <main className="mx-auto max-w-6xl px-4 py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{data.competition.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <FormatBadge format={data.competition.format} />
            <CompetitionStatusBadge status={data.competition.status} />
            <span className="tabular text-sm font-semibold tracking-widest text-muted-foreground">
              {data.competition.roomCode}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Vista pública, solo lectura · {data.completedMatches} de {data.totalMatches} partidos cargados
          </p>
        </div>
        <Link href={`/r/${data.competition.roomCode}/display`}>
          <Button className="w-full sm:w-auto" variant="secondary">
            <MonitorPlay size={16} />
            Pantalla grande
          </Button>
        </Link>
      </div>

      {data.isDemo && (
        <Alert className="mt-4" title="Sala de ejemplo" tone="info">
          Estos datos son de demostración y solo se muestran porque la aplicación no tiene Supabase
          configurado.
        </Alert>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section aria-labelledby="partidos-publicos" className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground" id="partidos-publicos">
            Partidos
          </h2>
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
        </section>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Clasificación</CardTitle>
          </CardHeader>
          <CardContent>
            <StandingsTable ranking={data.format.ranking} standings={data.standings} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
