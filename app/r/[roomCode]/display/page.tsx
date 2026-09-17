import { notFound } from "next/navigation";
import { CourtMatchCard } from "@/components/domain/court-match-card";
import { getAmericanoCompetitionDataByRoomCode } from "@/lib/competitions/americano-persistence";

export default async function DisplayPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  const data = await getAmericanoCompetitionDataByRoomCode(roomCode);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-emerald-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-lime-200">En vivo</p>
            <h1 className="text-5xl font-bold">{data.competition.name}</h1>
          </div>
          <p className="text-7xl font-bold">{data.standings[0]?.pointsFor ?? 0}</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {data.matches.map((match) => (
            <div key={match.id} className="text-emerald-950">
              <CourtMatchCard match={match} entries={data.entries} readonly />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
