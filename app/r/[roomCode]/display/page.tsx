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
    <main className="min-h-screen bg-emerald-950 p-4 text-white sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-lime-200">En vivo</p>
            <h1 className="text-3xl font-bold sm:text-5xl">{data.competition.name}</h1>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm uppercase text-lime-200">Games lider</p>
            <p className="text-5xl font-bold sm:text-7xl">{data.standings[0]?.pointsFor ?? 0}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
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
