import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicCompetition } from "@/lib/competitions/service/queries";
import type { SocialEntry, SocialMatch } from "@/lib/competitions/social/social-types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pantalla en vivo" };

/** Vista para proyectar en el club: texto grande, alto contraste y sin controles. */
export default async function DisplayPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  const data = await getPublicCompetition(roomCode);

  if (!data) notFound();

  const activeRound = data.rounds.find((round) => round.roundNumber === data.activeRoundNumber);
  const leaders = data.standings.slice(0, 5);

  return (
    <main className="min-h-screen bg-[#07241b] p-4 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-3 border-b border-white/15 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-[color:var(--accent)]">
              <span aria-hidden className="size-2 animate-pulse rounded-full bg-[color:var(--accent)]" />
              En vivo
            </p>
            <h1 className="mt-1 truncate text-3xl font-bold sm:text-5xl">{data.competition.name}</h1>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-widest text-white/60">Código de sala</p>
            <p className="tabular text-3xl font-bold tracking-[0.3em] sm:text-4xl">
              {data.competition.roomCode}
            </p>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section>
            <h2 className="text-lg font-semibold uppercase tracking-widest text-white/70">
              Ronda {activeRound?.roundNumber ?? "–"}
            </h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {(activeRound?.matches ?? []).map((match) => (
                <DisplayMatch entries={data.entries} key={match.id} match={match} />
              ))}
            </div>
            {activeRound && activeRound.sitOutEntryIds.length > 0 && (
              <p className="mt-4 text-lg text-white/70">
                Descansan:{" "}
                {activeRound.sitOutEntryIds
                  .map((id) => data.entries.find((entry) => entry.id === id)?.displayName ?? "—")
                  .join(", ")}
              </p>
            )}
          </section>
          <section>
            <h2 className="text-lg font-semibold uppercase tracking-widest text-white/70">Clasificación</h2>
            <ol className="mt-3 space-y-2">
              {leaders.map((row, index) => (
                <li
                  className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3"
                  key={row.entryId}
                >
                  <span className="tabular grid size-9 place-items-center rounded-lg bg-white/15 text-lg font-bold">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xl font-semibold">{row.displayName}</span>
                  <span className="tabular text-2xl font-bold">{row.pointsFor}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </main>
  );
}

function DisplayMatch({ entries, match }: { entries: SocialEntry[]; match: SocialMatch }) {
  const names = new Map(entries.map((entry) => [entry.id, entry.displayName]));
  const render = (ids: readonly string[], score?: number) => (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        {ids.map((id) => (
          <p className="truncate text-xl font-semibold sm:text-2xl" key={id}>
            {names.get(id) ?? "—"}
          </p>
        ))}
      </div>
      <span className="tabular text-4xl font-bold sm:text-5xl">{score ?? "–"}</span>
    </div>
  );

  return (
    <article className="rounded-2xl bg-white/10 p-4">
      <p className="text-sm font-semibold uppercase tracking-widest text-[color:var(--accent)]">
        {match.courtLabel}
      </p>
      <div className="mt-3 space-y-3">
        {render(match.sideA.entryIds, match.sideA.score)}
        <div className="h-px bg-white/20" />
        {render(match.sideB.entryIds, match.sideB.score)}
      </div>
    </article>
  );
}
