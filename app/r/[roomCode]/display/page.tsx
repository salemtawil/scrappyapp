import { CourtMatchCard } from "@/components/domain/court-match-card";
import { demoCompetition, demoEntries, demoRounds, demoStandings } from "@/lib/demo-data";

export default function DisplayPage() {
  return (
    <main className="min-h-screen bg-emerald-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-lime-200">En vivo</p>
            <h1 className="text-5xl font-bold">{demoCompetition.name}</h1>
          </div>
          <p className="text-7xl font-bold">{demoStandings[0]?.pointsFor ?? 0}</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {demoRounds[0].matches.map((match) => (
            <div key={match.id} className="text-emerald-950">
              <CourtMatchCard match={match} entries={demoEntries} readonly />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
