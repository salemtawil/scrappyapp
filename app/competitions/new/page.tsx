import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CreateCompetitionWizard } from "@/components/competitions/create-wizard";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getOwnedClubs } from "@/lib/clubs/queries";
import { getPlayersData } from "@/lib/players/queries";

export const metadata: Metadata = { title: "Crear competición" };

export default async function NewCompetitionPage() {
  const [data, clubs] = await Promise.all([getPlayersData(), getOwnedClubs()]);


  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Crear competición</h1>
        <p className="mt-1 text-muted-foreground">
          Seis pasos: tipo, detalles, puntuación, participantes, pistas y revisión.
        </p>

        <Card className="mt-5">
          <CardContent>
            {!data.configured ? (
              <Alert title="Modo demostración" tone="warning">
                Sin Supabase configurado no se pueden guardar competiciones. Configura las variables de
                entorno y aplica las migraciones para empezar a crear eventos reales.
              </Alert>
            ) : !data.user ? (
              <EmptyState
                action={
                  <Link href="/auth/login?next=/competitions/new">
                    <Button>Entrar</Button>
                  </Link>
                }
                description="Necesitas una sesión iniciada para crear y administrar competiciones."
                title="Inicia sesión"
              />
            ) : !data.isAdmin ? (
              <Alert title="Sin permiso de administrador" tone="error">
                Tu correo no está en <code>ADMIN_EMAILS</code>. Puedes ver salas públicas por código, pero
                no crear competiciones.
              </Alert>
            ) : data.players.length < 4 ? (
              <EmptyState
                action={
                  <Link href="/players">
                    <Button>Ir a jugadores</Button>
                  </Link>
                }
                description={`Tienes ${data.players.length} jugador${data.players.length === 1 ? "" : "es"} en tu lista y hacen falta 4 para armar un partido de dobles.`}
                title="Necesitas al menos 4 jugadores"
              />
            ) : (
              <CreateCompetitionWizard
                clubs={clubs.map((club) => ({ id: club.id, name: club.name }))}
                players={data.players.map((player) => ({
                  displayName: player.displayName,
                  id: player.id,
                  rating: player.rating,
                }))}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
