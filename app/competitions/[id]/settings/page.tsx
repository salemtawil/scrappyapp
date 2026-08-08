import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { es } from "@/lib/i18n/es";

export default function CompetitionSettingsPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold text-emerald-950">Ajustes</h1>
        <Card className="mt-5">
          <CardHeader>
            <h2 className="font-semibold">Cambios sensibles</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-slate-700">{es.errors.mexicanoHistorical}</p>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
