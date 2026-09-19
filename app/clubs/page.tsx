import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CreateClubForm } from "@/components/clubs/create-club-form";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getAdminSession } from "@/lib/auth/admin";
import { getOwnedClubs } from "@/lib/clubs/queries";

export const metadata: Metadata = { title: "Organizaciones" };

export default async function ClubsPage() {
  const [admin, clubs] = await Promise.all([getAdminSession(), getOwnedClubs()]);

  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Organizaciones</h1>
        <p className="mt-1 text-muted-foreground">
          Una sala pública para agrupar las competiciones de un club.
        </p>

        {admin.user && !admin.isAdmin ? (
          <Alert className="mt-5" title="Sin permiso de administrador" tone="error">
            Tu correo no está autorizado para crear organizaciones.
          </Alert>
        ) : (
          <Card className="mt-5">
            <CardHeader>
              <CardTitle>Crear organización</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateClubForm />
            </CardContent>
          </Card>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {clubs.length > 0 ? (
            clubs.map((club) => (
              <Link className="block" href={`/clubs/${club.slug}`} key={club.id}>
                <Card className="h-full transition-colors hover:bg-surface-muted">
                  <CardContent>
                    <h2 className="font-semibold text-foreground">{club.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {club.city ?? "Sala pública de competiciones"}
                    </p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-brand-strong">
                      Código: {club.slug}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="sm:col-span-2">
              <EmptyState
                description="Crea una para agrupar tus Americanos y Mexicanos bajo un mismo código público."
                title="Todavía no tienes organizaciones"
              />
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
