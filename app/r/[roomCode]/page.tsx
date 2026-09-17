import { notFound } from "next/navigation";
import { CompetitionStatusBadge, FormatBadge } from "@/components/domain/badges";
import { CourtMatchCard } from "@/components/domain/court-match-card";
import { StandingsTable } from "@/components/domain/standings-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getAmericanoCompetitionDataByRoomCode } from "@/lib/competitions/americano-persistence";

export default async function PublicRoomPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  const data = await getAmericanoCompetitionDataByRoomCode(roomCode);

  if (!data) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-emerald-950">{data.competition.name}</h1>
          <p className="text-sm text-slate-600">Vista publica sin controles administrativos.</p>
        </div>
        <div className="flex gap-2">
          <FormatBadge format={data.competition.format} />
          <CompetitionStatusBadge status={data.competition.status} />
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="grid gap-4 md:grid-cols-2">
          {data.matches.map((match) => (
            <CourtMatchCard key={match.id} match={match} entries={data.entries} readonly />
          ))}
        </section>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Clasificacion</h2>
          </CardHeader>
          <CardContent>
            <StandingsTable standings={data.standings} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
