import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CompetitionStatusBadge, FormatBadge } from "@/components/domain/badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getClubBySlug } from "@/lib/clubs/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getClubBySlug(slug);
  return { title: data ? data.club.name : "Organización no encontrada" };
}

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getClubBySlug(slug);

  if (!data) notFound();

  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{data.club.name}</h1>
        <p className="mt-1 text-muted-foreground">{data.club.city ?? "Sala pública de competiciones"}</p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-brand-strong">
          Código: {data.club.slug}
        </p>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Competiciones públicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.competitions.length > 0 ? (
              data.competitions.map((competition) => (
                <Link
                  className="flex flex-col gap-2 rounded-lg border border-line p-3 hover:bg-surface-muted sm:flex-row sm:items-center sm:justify-between"
                  href={`/r/${competition.roomCode}`}
                  key={competition.roomCode}
                >
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-foreground">{competition.name}</h3>
                    <p className="tabular text-sm text-muted-foreground">Código {competition.roomCode}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <FormatBadge format={competition.format} />
                    <CompetitionStatusBadge status={competition.status} />
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState
                description="Cuando esta organización publique una competición aparecerá aquí."
                title="Todavía no hay competiciones públicas"
              />
            )}
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
