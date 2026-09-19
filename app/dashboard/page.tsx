import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ListChecks, PlayCircle, PlusCircle, Radio, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CompetitionStatusBadge, FormatBadge } from "@/components/domain/badges";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardData } from "@/lib/competitions/queries";

export const metadata: Metadata = { title: "Panel" };

export default async function DashboardPage() {
  const dashboard = await getDashboardData();
  const canManage = !dashboard.configured || dashboard.isAdmin;

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Panel</h1>
            <p className="mt-1 text-muted-foreground">Organizaciones, competiciones, códigos y marcadores.</p>
          </div>
          {canManage && dashboard.configured && (
            <div className="grid gap-2 sm:flex">
              <Link href="/clubs">
                <Button className="w-full" variant="secondary">
                  <Building2 size={16} />
                  Organizaciones
                </Button>
              </Link>
              <Link href={dashboard.user ? "/competitions/new" : "/auth/login?next=/competitions/new"}>
                <Button className="w-full">
                  <PlusCircle size={18} />
                  Crear competición
                </Button>
              </Link>
            </div>
          )}
        </div>

        {!dashboard.configured && (
          <Alert className="mt-5" title="Modo demostración" tone="warning">
            No hay Supabase configurado, así que lo que ves es una competición de ejemplo. Configura las
            variables de entorno y aplica las migraciones de <code>supabase/migrations</code> para trabajar
            con datos reales.
          </Alert>
        )}
        {dashboard.configured && dashboard.user && !dashboard.isAdmin && (
          <Alert className="mt-5" title="Sin permiso de administrador" tone="error">
            Tu correo no está en <code>ADMIN_EMAILS</code>. Puedes entrar en salas públicas con su código,
            pero no administrar eventos.
          </Alert>
        )}

        {canManage && (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric icon={<Radio size={18} />} label="Organizaciones" value={dashboard.organizationCount} />
              <Metric icon={<ListChecks size={18} />} label="Competiciones" value={dashboard.competitions.length} />
              <Metric icon={<PlayCircle size={18} />} label="En vivo" value={dashboard.liveCount} />
              <Metric icon={<Users size={18} />} label="Jugadores" value={dashboard.activePlayers} />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Organizaciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboard.organizations.length > 0 ? (
                    dashboard.organizations.map((organization) => (
                      <div className="rounded-lg border border-line p-3" key={organization.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-foreground">{organization.name}</h3>
                            <p className="text-sm text-muted-foreground">Código: {organization.slug}</p>
                            <p className="text-sm text-muted-foreground">
                              {organization.competitionCount} competici
                              {organization.competitionCount === 1 ? "ón" : "ones"}
                            </p>
                          </div>
                          <Link href={`/clubs/${organization.slug}`}>
                            <Button variant="secondary">Ver</Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      action={
                        <Link href="/clubs">
                          <Button>Crear organización</Button>
                        </Link>
                      }
                      description="Agrupa tus eventos bajo un código público para que la gente los encuentre."
                      title="Sin organizaciones"
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Competiciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboard.competitions.length > 0 ? (
                    dashboard.competitions.map((competition) => (
                      <div className="rounded-lg border border-line p-3" key={competition.id}>
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold text-foreground">{competition.name}</h3>
                            <p className="tabular text-sm text-muted-foreground">
                              Código {competition.roomCode}
                              {competition.club ? ` · ${competition.club.name}` : " · Personal"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {competition.playerCount} jugadores · {competition.completedMatches} jugados ·{" "}
                              {competition.pendingMatches} pendientes
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <FormatBadge format={competition.format} />
                            <CompetitionStatusBadge status={competition.status} />
                          </div>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          {dashboard.configured ? (
                            <>
                              <Link href={`/competitions/${competition.id}`}>
                                <Button className="w-full" variant="secondary">
                                  Ver
                                </Button>
                              </Link>
                              <Link href={`/competitions/${competition.id}/live`}>
                                <Button className="w-full">Marcadores</Button>
                              </Link>
                            </>
                          ) : null}
                          <Link
                            className={dashboard.configured ? "" : "sm:col-span-3"}
                            href={`/r/${competition.roomCode}`}
                          >
                            <Button className="w-full" variant="secondary">
                              Sala pública
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      action={
                        <Link href="/competitions/new">
                          <Button>Crear la primera</Button>
                        </Link>
                      }
                      description="Monta un Americano o un Mexicano y comparte el código con quienes juegan."
                      title="Todavía no tienes competiciones"
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <span aria-hidden className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand-strong">
            {icon}
          </span>
        </div>
        <p className="tabular mt-2 text-3xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
