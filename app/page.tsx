import Link from "next/link";
import { CalendarPlus, Radio, Trophy, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { joinByCodeAction } from "@/app/join/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { productConfig } from "@/lib/config/product";

const formats = [
  ["Americano", "Parejas rotativas y games acumulados.", UsersRound],
  ["Mexicano", "Rondas por ranking en vivo.", Radio],
  ["Ligas", "Parejas fijas, calendario y tabla.", CalendarPlus],
  ["Torneos", "Round robin y eliminacion.", Trophy],
] as const;

export default function Home() {
  return (
    <AppShell>
      <main>
        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.1fr_0.9fr] md:py-16">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase text-emerald-700">Padel competitivo sin hojas sueltas</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-emerald-950 md:text-6xl">
              {productConfig.name}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
              Crea Americanos, Mexicanos, ligas y torneos; comparte marcador en vivo por QR y evita conflictos de
              resultados entre dispositivos.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/competitions/new">
                <Button>
                  <CalendarPlus size={18} />
                  Crear competicion
                </Button>
              </Link>
              <Link href="/r/PADEL8">
                <Button variant="secondary">Ver sala demo</Button>
              </Link>
            </div>
            <form action={joinByCodeAction} className="mt-5 grid gap-3 rounded-lg border border-emerald-950/10 bg-white p-3 shadow-sm sm:grid-cols-[1fr_auto]">
              <Input name="code" placeholder="Ingresa codigo de competicion u organizacion" required />
              <Button type="submit">Entrar</Button>
            </form>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {formats.map(([title, description, Icon]) => (
              <Card key={title}>
                <CardContent>
                  <Icon className="mb-4 text-emerald-700" size={28} />
                  <h2 className="font-semibold text-emerald-950">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
