import type { ReactNode } from "react";
import { Calendar, Eye, MapPin, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const typeCards = ["Americano", "Mexicano", "Liga", "Torneo"];

export default function NewCompetitionPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-bold text-emerald-950">Crear competicion</h1>
        <p className="mt-1 text-slate-600">Wizard movil con validaciones de jugadores, pistas y formato.</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-2">
            {["Tipo", "Detalles", "Participantes", "Formato", "Revision"].map((step, index) => (
              <div key={step} className="rounded-md border border-emerald-950/10 bg-white px-3 py-2 text-sm">
                <span className="mr-2 font-semibold text-emerald-700">{index + 1}</span>
                {step}
              </div>
            ))}
          </aside>
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Configuracion rapida</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {typeCards.map((type) => (
                  <button
                    key={type}
                    className="rounded-lg border border-emerald-950/10 bg-white p-4 text-left hover:border-emerald-700 hover:bg-emerald-50"
                    type="button"
                  >
                    <UsersRound className="mb-3 text-emerald-700" size={22} />
                    <p className="font-semibold">{type}</p>
                  </button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  Nombre
                  <Input placeholder="Americano Viernes Noche" />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Fecha y hora
                  <Input type="datetime-local" />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Pistas
                  <Input min={1} max={16} defaultValue={2} type="number" />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Puntos objetivo
                  <Input min={1} max={99} defaultValue={24} type="number" />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Info icon={<MapPin size={16} />} label="Club o personal" value="Club demo" />
                <Info icon={<Eye size={16} />} label="Visibilidad" value="Publica con enlace" />
                <Info icon={<Calendar size={16} />} label="Rondas" value="Fijas u open-ended" />
              </div>
              <Button type="button">Crear y generar primera ronda</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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
