import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ScoreMatchCard } from "@/components/domain/score-match-card";
import { getAmericanoCompetitionData } from "@/lib/competitions/americano-persistence";

export default async function LiveConsolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAmericanoCompetitionData(id);

  if (!data) {
    notFound();
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold text-emerald-950">Marcadores en vivo</h1>
        <p className="mt-1 text-sm text-slate-600">{data.competition.name}</p>
        <div className="mt-5 space-y-4">
          {data.matches.map((match) => (
            <ScoreMatchCard competitionId={data.competition.id} entries={data.entries} key={match.id} match={match} />
          ))}
        </div>
      </main>
    </AppShell>
  );
}
