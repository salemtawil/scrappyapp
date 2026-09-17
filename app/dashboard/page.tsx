import Link from "next/link";
import { Eye, ListChecks, PlayCircle, PlusCircle, Radio, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CompetitionStatusBadge, FormatBadge } from "@/components/domain/badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getDashboardData } from "@/lib/competitions/queries";

export default async function DashboardPage() {
  const dashboard = await getDashboardData();

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-emerald-950">Panel admin</h1>
            <p className="mt-1 text-slate-600">Todo lo creado: organizaciones, competiciones, codigos y marcadores.</p>
          </div>
          <div className="grid gap-2 sm:flex">
            <Link href="/clubs">
              <Button className="w-full" variant="secondary" type="button">
                Organizaciones
              </Button>
            </Link>
            <Link href={dashboard.user ? "/competitions/new" : "/auth/login?next=/competitions/new"}>
              <Button className="w-full" type="button">
                <PlusCircle size={18} />
                Crear competicion
              </Button>
            </Link>
          </div>
        </div>
        {!dashboard.configured && (
          <Card className="mt-6 border-amber-300 bg-amber-50">
            <CardContent>
              <p className="font-semibold text-amber-950">Modo demo activo</p>
              <p className="mt-1 text-sm text-amber-900">
                Configura Supabase para activar usuarios, organizaciones y competiciones reales.
              </p>
            </CardContent>
          </Card>
        )}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={<Radio size={18} />} label="Organizaciones" value={dashboard.organizationCount} />
          <Metric icon={<ListChecks size={18} />} label="Competiciones" value={dashboard.competitions.length} />
          <Metric icon={<PlayCircle size={18} />} label="En vivo" value={dashboard.liveCount} />
          <Metric icon={<Users size={18} />} label="Jugadores" value={dashboard.activePlayers} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Organizaciones</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.organizations.length > 0 ? (
                dashboard.organizations.map((organization) => (
                  <div className="rounded-md border border-emerald-950/10 p-4" key={organization.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-emerald-950">{organization.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">Codigo: {organization.slug}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {organization.competitionCount} competicion
                          {organization.competitionCount === 1 ? "" : "es"}
                        </p>
                      </div>
                      <Link href={`/clubs/${organization.slug}`}>
                        <Button variant="secondary" type="button">
                          Ver
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-emerald-950/20 p-6 text-center">
                  <p className="font-semibold text-emerald-950">No hay organizaciones.</p>
                  <p className="mt-1 text-sm text-slate-600">Crea una sala como Compinche para agrupar eventos.</p>
                  <Link className="mt-4 inline-flex" href="/clubs">
                    <Button type="button">Crear organizacion</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold">Competiciones</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.competitions.length > 0 ? (
                dashboard.competitions.map((competition) => (
                  <div className="rounded-md border border-emerald-950/10 p-4" key={competition.id}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-emerald-950">{competition.name}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Codigo: {competition.roomCode}
                          {competition.club ? ` · ${competition.club.name}` : " · Personal"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {competition.playerCount} jugadores · {competition.completedMatches} jugados ·{" "}
                          {competition.pendingMatches} pendientes
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <FormatBadge format={competition.format} />
                        <CompetitionStatusBadge status={competition.status} />
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <Link href={`/competitions/${competition.id}`}>
                        <Button className="w-full" variant="secondary" type="button">
                          <Eye size={16} />
                          Ver
                        </Button>
                      </Link>
                      <Link href={`/competitions/${competition.id}/live`}>
                        <Button className="w-full" type="button">
                          Marcadores
                        </Button>
                      </Link>
                      <Link href={`/r/${competition.roomCode}`}>
                        <Button className="w-full" variant="secondary" type="button">
                          Sala publica
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-emerald-950/20 p-6 text-center">
                  <p className="font-semibold text-emerald-950">Aun no tienes competiciones.</p>
                  <p className="mt-1 text-sm text-slate-600">Crea la primera y compartela por codigo.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">{label}</p>
          <span className="grid size-9 place-items-center rounded-md bg-emerald-50 text-emerald-800">{icon}</span>
        </div>
        <p className="mt-2 text-3xl font-bold text-emerald-950">{value}</p>
      </CardContent>
    </Card>
  );
}
