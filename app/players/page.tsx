import { Upload } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { demoEntries } from "@/lib/demo-data";

export default function PlayersPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-emerald-950">Jugadores</h1>
          <Button variant="secondary" type="button">
            <Upload size={16} />
            Importar CSV
          </Button>
        </div>
        <Input className="mt-5" placeholder="Buscar jugador" />
        <Card className="mt-5">
          <CardHeader>
            <h2 className="font-semibold">Registros invitados</h2>
          </CardHeader>
          <CardContent className="divide-y divide-emerald-950/10">
            {demoEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-3">
                <span className="font-medium">{entry.displayName}</span>
                <span className="text-sm text-slate-500">Rating {entry.initialRating?.toFixed(1)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
