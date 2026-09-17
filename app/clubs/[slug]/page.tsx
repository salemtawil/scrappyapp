import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CompetitionStatusBadge, FormatBadge } from "@/components/domain/badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getClubBySlug } from "@/lib/clubs/queries";

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getClubBySlug(slug);

  if (!data) {
    notFound();
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-emerald-950">{data.club.name}</h1>
            <p className="mt-1 text-slate-600">{data.club.city ?? "Sala publica de competiciones"}</p>
            <p className="mt-2 text-xs font-semibold uppercase text-emerald-700">Codigo: {data.club.slug}</p>
          </div>
          <Link href="/competitions/new">
            <Button type="button">Crear competicion</Button>
          </Link>
        </div>
        <Card className="mt-6">
          <CardHeader>
            <h2 className="font-semibold">Competiciones</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.competitions.length > 0 ? (
              data.competitions.map((competition) => (
                <Link
                  className="flex flex-col gap-3 rounded-md border border-emerald-950/10 p-4 hover:bg-emerald-50 sm:flex-row sm:items-center sm:justify-between"
                  href={`/competitions/${competition.id}`}
                  key={competition.id}
                >
                  <div>
                    <h3 className="font-semibold text-emerald-950">{competition.name}</h3>
                    <p className="text-sm text-slate-600">Codigo {competition.roomCode}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <FormatBadge format={competition.format} />
                    <CompetitionStatusBadge status={competition.status} />
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-emerald-950/20 p-6 text-center">
                <p className="font-semibold text-emerald-950">Aun no hay competiciones publicas.</p>
                <p className="mt-1 text-sm text-slate-600">Crea una competicion y elige esta organizacion.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
