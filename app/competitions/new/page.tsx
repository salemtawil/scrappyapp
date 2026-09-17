import Link from "next/link";
import { Calendar, Eye, MapPin, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { createAmericanoAction } from "@/app/competitions/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getPlayerLevelLabel } from "@/lib/players/levels";
import { getPlayersData } from "@/lib/players/queries";

const inactiveTypes = ["Mexicano", "Liga", "Torneo"];

export default async function NewCompetitionPage() {
  const data = await getPlayersData();
  const defaultCourtCount = Math.max(1, Math.min(4, Math.floor(data.players.length / 4) || 1));
  const defaultRoundCount = Math.max(1, Math.min(7, data.players.length - 1 || 4));

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-bold text-emerald-950">Crear competicion</h1>
        <p className="mt-1 text-slate-600">Arma un Americano social con rotacion de parejas y puntos individuales.</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-2">
            {["Tipo", "Detalles", "Participantes", "Generar"].map((step, index) => (
              <div key={step} className="rounded-md border border-emerald-950/10 bg-white px-3 py-2 text-sm">
                <span className="mr-2 font-semibold text-emerald-700">{index + 1}</span>
                {step}
              </div>
            ))}
          </aside>
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Americano</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border-2 border-emerald-700 bg-emerald-50 p-4 text-left">
                  <UsersRound className="mb-3 text-emerald-700" size={22} />
                  <p className="font-semibold text-emerald-950">Americano</p>
                  <p className="mt-1 text-sm text-slate-600">Parejas rotativas, puntos individuales.</p>
                </div>
                {inactiveTypes.map((type) => (
                  <div key={type} className="rounded-lg border border-emerald-950/10 bg-white p-4 text-left opacity-60">
                    <UsersRound className="mb-3 text-slate-400" size={22} />
                    <p className="font-semibold">{type}</p>
                    <p className="mt-1 text-sm text-slate-500">Disponible despues.</p>
                  </div>
                ))}
              </div>
              {data.players.length < 4 ? (
                <div className="rounded-md border border-dashed border-emerald-950/20 p-6 text-center">
                  <p className="font-semibold text-emerald-950">Necesitas al menos 4 jugadores.</p>
                  <p className="mt-1 text-sm text-slate-600">Agrega jugadores antes de crear un Americano.</p>
                  <Link className="mt-4 inline-flex" href="/players">
                    <Button type="button">Ir a jugadores</Button>
                  </Link>
                </div>
              ) : (
                <form action={createAmericanoAction} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm font-medium">
                      Nombre
                      <Input name="name" placeholder="Americano Viernes Noche" required />
                    </label>
                    <label className="space-y-2 text-sm font-medium">
                      Fecha y hora
                      <Input name="startsAt" type="datetime-local" />
                    </label>
                    <label className="space-y-2 text-sm font-medium">
                      Pistas
                      <Input max={16} min={1} name="courtCount" required defaultValue={defaultCourtCount} type="number" />
                    </label>
                    <label className="space-y-2 text-sm font-medium">
                      Puntos por partido
                      <Input max={99} min={1} name="targetPoints" required defaultValue={24} type="number" />
                    </label>
                    <label className="space-y-2 text-sm font-medium">
                      Rondas
                      <Input max={20} min={1} name="roundCount" required defaultValue={defaultRoundCount} type="number" />
                    </label>
                  </div>
                  <section>
                    <h3 className="font-semibold text-emerald-950">Jugadores</h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {data.players.map((player) => (
                        <label
                          className="flex items-center gap-3 rounded-md border border-emerald-950/10 bg-white p-3 text-sm"
                          key={player.id}
                        >
                          <input
                            className="size-4 accent-emerald-700"
                            defaultChecked
                            name="playerIds"
                            type="checkbox"
                            value={player.id}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-emerald-950">{player.displayName}</span>
                            <span className="text-slate-500">{getPlayerLevelLabel(player.rating)}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </section>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Info icon={<MapPin size={16} />} label="Ambito" value="Personal" />
                    <Info icon={<Eye size={16} />} label="Visibilidad" value="Publica con enlace" />
                    <Info icon={<Calendar size={16} />} label="Tabla" value="Puntos acumulados" />
                  </div>
                  <Button type="submit">Crear y generar partidos</Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-emerald-50 p-3 text-sm">
      <div className="flex items-center gap-2 font-semibold text-emerald-950">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-slate-600">{value}</p>
    </div>
  );
}
