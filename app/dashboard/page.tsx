import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CompetitionStatusBadge, FormatBadge } from "@/components/domain/badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getDashboardData } from "@/lib/competitions/queries";

export default async function DashboardPage() {
  const dashboard = await getDashboardData();
  const weeklyMatches = dashboard.configured ? 0 : 26;

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-emerald-950">Panel</h1>
            <p className="mt-1 text-slate-600">Competiciones proximas, en vivo y recientes.</p>
          </div>
          <Link href={dashboard.user ? "/competitions/new" : "/auth/login?next=/competitions/new"}>
            <Button>
              <PlusCircle size={18} />
              Crear competicion
            </Button>
          </Link>
        </div>
        {!dashboard.configured && (
          <Card className="mt-6 border-amber-300 bg-amber-50">
            <CardContent>
              <p className="font-semibold text-amber-950">Modo demo activo</p>
              <p className="mt-1 text-sm text-amber-900">
                Configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` para activar usuarios y
                datos reales.
              </p>
            </CardContent>
          </Card>
        )}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent>
              <p className="text-sm text-slate-500">En vivo</p>
              <p className="mt-2 text-3xl font-bold text-emerald-950">{dashboard.liveCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-slate-500">Jugadores activos</p>
              <p className="mt-2 text-3xl font-bold text-emerald-950">{dashboard.activePlayers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-slate-500">Partidos esta semana</p>
              <p className="mt-2 text-3xl font-bold text-emerald-950">{weeklyMatches}</p>
            </CardContent>
          </Card>
        </div>
        <Card className="mt-6">
          <CardHeader>
            <h2 className="font-semibold">Competiciones</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.competitions.length > 0 ? (
              dashboard.competitions.map((competition) => (
                <Link
                  href={`/competitions/${competition.id}`}
                  className="flex flex-col gap-3 rounded-md border border-emerald-950/10 p-4 hover:bg-emerald-50 sm:flex-row sm:items-center sm:justify-between"
                  key={competition.id}
                >
                  <div>
                    <h3 className="font-semibold text-emerald-950">{competition.name}</h3>
                    <p className="text-sm text-slate-600">Sala {competition.roomCode}</p>
                  </div>
                  <div className="flex gap-2">
                    <FormatBadge format={competition.format} />
                    <CompetitionStatusBadge status={competition.status} />
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-emerald-950/20 p-6 text-center">
                <p className="font-semibold text-emerald-950">Aun no tienes competiciones.</p>
                <p className="mt-1 text-sm text-slate-600">Crea la primera y empieza a registrar jugadores.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
