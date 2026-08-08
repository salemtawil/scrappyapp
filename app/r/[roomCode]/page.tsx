import { CompetitionStatusBadge, FormatBadge } from "@/components/domain/badges";
import { CourtMatchCard } from "@/components/domain/court-match-card";
import { StandingsTable } from "@/components/domain/standings-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { demoCompetition, demoEntries, demoRounds, demoStandings } from "@/lib/demo-data";

export default async function PublicRoomPage({ params }: { params: Promise<{ roomCode: string }> }) {
  await params;
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-emerald-950">{demoCompetition.name}</h1>
          <p className="text-sm text-slate-600">Vista publica sin controles administrativos.</p>
        </div>
        <div className="flex gap-2">
          <FormatBadge format={demoCompetition.format} />
          <CompetitionStatusBadge status={demoCompetition.status} />
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="grid gap-4 md:grid-cols-2">
          {demoRounds[0].matches.map((match) => (
            <CourtMatchCard key={match.id} match={match} entries={demoEntries} readonly />
          ))}
        </section>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Clasificacion</h2>
          </CardHeader>
          <CardContent>
            <StandingsTable standings={demoStandings} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
