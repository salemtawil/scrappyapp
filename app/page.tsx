import Link from "next/link";
import { CalendarPlus, Radio, Trophy, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { JoinForm } from "@/components/domain/join-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listFormats } from "@/lib/competitions/formats/registry";
import { isAvailableFormat } from "@/lib/competitions/formats/types";
import { productConfig } from "@/lib/config/product";
import { DEMO_ROOM_CODE } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";

const icons = [UsersRound, Radio, CalendarPlus, Trophy];

export default function Home() {
  const formats = listFormats();

  return (
    <AppShell>
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[1.05fr_0.95fr] md:py-14">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-strong">
            Pádel competitivo sin hojas sueltas
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-foreground md:text-5xl">
            {productConfig.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
            Crea Americanos y Mexicanos, carga marcadores desde la pista y comparte la clasificación en
            vivo por enlace o QR sin que dos móviles se pisen el resultado.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/competitions/new">
              <Button className="w-full sm:w-auto" size="lg">
                <CalendarPlus size={18} />
                Crear competición
              </Button>
            </Link>
            {!hasSupabaseEnv() && (
              <Link href={`/r/${DEMO_ROOM_CODE}`}>
                <Button className="w-full sm:w-auto" size="lg" variant="secondary">
                  Ver sala de ejemplo
                </Button>
              </Link>
            )}
          </div>
          <div className="mt-6">
            <JoinForm />
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {formats.slice(0, 4).map((item, index) => {
            const Icon = icons[index] ?? Trophy;
            return (
              <li key={item.format}>
                <Card className="h-full">
                  <CardContent>
                    <Icon aria-hidden className="mb-3 text-brand" size={26} />
                    <h2 className="font-semibold text-foreground">{item.label}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.tagline}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {isAvailableFormat(item) ? "Disponible" : "En preparación"}
                    </p>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      </main>
    </AppShell>
  );
}
