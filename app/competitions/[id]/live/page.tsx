import { AppShell } from "@/components/app-shell";
import { CourtMatchCard } from "@/components/domain/court-match-card";
import { demoEntries, demoRounds } from "@/lib/demo-data";

export default function LiveConsolePage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold text-emerald-950">Marcadores en vivo</h1>
        <p className="mt-1 text-sm text-slate-600">Entrada rapida por pista con control de version por marcador.</p>
        <div className="mt-5 space-y-4">
          {demoRounds[0].matches.map((match) => (
            <CourtMatchCard key={match.id} match={match} entries={demoEntries} />
          ))}
        </div>
      </main>
    </AppShell>
  );
}
