import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CompetitionStatusBadge, FormatBadge } from "@/components/domain/badges";
import { CourtMatchCard } from "@/components/domain/court-match-card";
import { ShareCompetitionDialog } from "@/components/domain/share-dialog";
import { StandingsTable } from "@/components/domain/standings-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getAmericanoCompetitionData } from "@/lib/competitions/americano-persistence";
import { absoluteUrl } from "@/lib/utils";

export default async function CompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAmericanoCompetitionData(id);

  if (!data) {
    notFound();
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-emerald-950 sm:text-3xl">{data.competition.name}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <FormatBadge format={data.competition.format} />
              <CompetitionStatusBadge status={data.competition.status} />
            </div>
          </div>
          <div className="grid gap-2 sm:flex">
            <Link href={`/r/${data.competition.roomCode}`}>
              <Button className="w-full" variant="secondary" type="button">
                Ver sala publica
              </Button>
            </Link>
            <Link href={`/competitions/${data.competition.id}/live`}>
              <Button className="w-full" type="button">
                Cargar marcadores
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-4 lg:order-1">
            {data.matches.map((match) => (
              <CourtMatchCard key={match.id} match={match} entries={data.entries} readonly />
            ))}
          </section>
          <aside className="space-y-4 lg:order-2">
            <ShareCompetitionDialog url={absoluteUrl(`/r/${data.competition.roomCode}`)} />
            <Card>
              <CardHeader>
                <h2 className="font-semibold">Clasificacion</h2>
              </CardHeader>
              <CardContent>
                <StandingsTable standings={data.standings} />
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
