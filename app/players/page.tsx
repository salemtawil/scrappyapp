import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { PlayerManager } from "@/components/players/player-manager";
import { Alert } from "@/components/ui/alert";
import { getPlayersData } from "@/lib/players/queries";

export const metadata: Metadata = { title: "Jugadores" };

export default async function PlayersPage() {
  const data = await getPlayersData();
  const canManage = Boolean(data.configured && data.user && data.isAdmin);

  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Jugadores</h1>
        <p className="mt-1 text-muted-foreground">Tu lista base para montar competiciones rápido.</p>

        {!data.configured && (
          <Alert className="mt-5" title="Modo demostración" tone="warning">
            Con Supabase configurado podrás crear y editar jugadores reales desde esta pantalla.
          </Alert>
        )}
        {data.configured && data.user && !data.isAdmin && (
          <Alert className="mt-5" title="Sin permiso de administrador" tone="error">
            Tu correo no está en <code>ADMIN_EMAILS</code>: puedes ver salas públicas, pero no gestionar
            jugadores.
          </Alert>
        )}

        <div className="mt-5">
          <PlayerManager canManage={canManage} players={data.players} />
        </div>
      </main>
    </AppShell>
  );
}
