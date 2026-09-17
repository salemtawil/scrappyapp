import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { createClubAction } from "@/app/clubs/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getOwnedClubs } from "@/lib/clubs/queries";

export default async function ClubsPage() {
  const clubs = await getOwnedClubs();

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-bold text-emerald-950">Organizaciones</h1>
        <p className="mt-1 text-slate-600">Crea una sala publica para agrupar competiciones.</p>
        <Card className="mt-5">
          <CardHeader>
            <h2 className="font-semibold">Crear organizacion</h2>
          </CardHeader>
          <CardContent>
            <form action={createClubAction} className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
              <Input name="name" placeholder="Compinche" required />
              <Input name="city" placeholder="Ciudad" />
              <Button type="submit">Crear</Button>
            </form>
          </CardContent>
        </Card>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {clubs.length > 0 ? (
            clubs.map((club) => (
              <Link href={`/clubs/${club.slug}`} key={club.id}>
                <Card>
                  <CardContent>
                    <h2 className="font-semibold">{club.name}</h2>
                    <p className="mt-2 text-sm text-slate-600">{club.city ?? "Sala publica de competiciones"}</p>
                    <p className="mt-2 text-xs font-semibold uppercase text-emerald-700">Codigo: {club.slug}</p>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card>
              <CardContent>
                <p className="font-semibold text-emerald-950">Todavia no tienes organizaciones.</p>
                <p className="mt-2 text-sm text-slate-600">Crea una para agrupar tus Americanos y torneos.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </AppShell>
  );
}
