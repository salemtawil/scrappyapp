import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";

export default function ClubSettingsPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold text-emerald-950">Ajustes del club</h1>
        <Card className="mt-5">
          <CardContent>Zona horaria, ciudad, logo y estado activo.</CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
