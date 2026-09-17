import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CompetitionStatusBadge, FormatBadge } from "@/components/domain/badges";
import { CourtMatchCard } from "@/components/domain/court-match-card";
import { ShareCompetitionDialog } from "@/components/domain/share-dialog";
import { StandingsTable } from "@/components/domain/standings-table";
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
            <h1 className="text-3xl font-bold text-emerald-950">{data.competition.name}</h1>
            <div className="mt-3 flex gap-2">
              <FormatBadge format={data.competition.format} />
              <CompetitionStatusBadge status={data.competition.status} />
            </div>
          </div>
          <Link className="text-sm font-semibold text-emerald-700" href={`/competitions/${data.competition.id}/live`}>
            Consola de marcadores
          </Link>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-4">
            {data.matches.map((match) => (
              <CourtMatchCard key={match.id} match={match} entries={data.entries} readonly />
            ))}
          </section>
          <aside className="space-y-4">
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
