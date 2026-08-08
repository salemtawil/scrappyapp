import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CompetitionStatusBadge, FormatBadge } from "@/components/domain/badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { demoCompetition } from "@/lib/demo-data";

export default function DashboardPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-emerald-950">Panel</h1>
            <p className="mt-1 text-slate-600">Competiciones proximas, en vivo y recientes.</p>
          </div>
          <Link href="/competitions/new">
            <Button>
              <PlusCircle size={18} />
              Crear competicion
            </Button>
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {["En vivo", "Jugadores activos", "Partidos esta semana"].map((label, index) => (
            <Card key={label}>
              <CardContent>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-emerald-950">{[1, 48, 26][index]}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="mt-6">
          <CardHeader>
            <h2 className="font-semibold">Competiciones</h2>
          </CardHeader>
          <CardContent>
            <Link
              href={`/competitions/${demoCompetition.id}`}
              className="flex flex-col gap-3 rounded-md border border-emerald-950/10 p-4 hover:bg-emerald-50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3 className="font-semibold text-emerald-950">{demoCompetition.name}</h3>
                <p className="text-sm text-slate-600">Sala {demoCompetition.roomCode}</p>
              </div>
              <div className="flex gap-2">
                <FormatBadge format={demoCompetition.format} />
                <CompetitionStatusBadge status={demoCompetition.status} />
              </div>
            </Link>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
