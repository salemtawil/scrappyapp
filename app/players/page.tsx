import { AppShell } from "@/components/app-shell";
import { addPlayerAction } from "@/app/players/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPlayersData } from "@/lib/players/queries";

export default async function PlayersPage() {
  const data = await getPlayersData();

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-emerald-950">Jugadores</h1>
            <p className="mt-1 text-slate-600">Tu lista base para armar competiciones rapidamente.</p>
          </div>
        </div>
        {!data.configured && (
          <Card className="mt-5 border-amber-300 bg-amber-50">
            <CardContent>
              <p className="font-semibold text-amber-950">Modo demo activo</p>
              <p className="mt-1 text-sm text-amber-900">
                Con Supabase configurado podras crear jugadores reales desde esta pantalla.
              </p>
            </CardContent>
          </Card>
        )}
        {data.user && (
          <Card className="mt-5">
            <CardHeader>
              <h2 className="font-semibold">Agregar jugador</h2>
            </CardHeader>
            <CardContent>
              <form action={addPlayerAction} className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
                <Input name="displayName" placeholder="Nombre del jugador" required />
                <Input max="7" min="0" name="rating" placeholder="Rating" step="0.1" type="number" />
                <Button type="submit">Agregar</Button>
              </form>
            </CardContent>
          </Card>
        )}
        <Input className="mt-5" placeholder="Buscar jugador" />
        <Card className="mt-5">
          <CardHeader>
            <h2 className="font-semibold">Jugadores registrados</h2>
          </CardHeader>
          <CardContent className="divide-y divide-emerald-950/10">
            {data.players.length > 0 ? (
              data.players.map((player) => (
                <div key={player.id} className="flex items-center justify-between py-3">
                  <span className="font-medium">{player.displayName}</span>
                  <span className="text-sm text-slate-500">
                    {player.rating === null ? "Sin rating" : `Rating ${player.rating.toFixed(1)}`}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-sm text-slate-600">
                Todavia no hay jugadores. Agrega el primero para preparar una competicion.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
