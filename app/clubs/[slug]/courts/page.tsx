import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";

export default function CourtsPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold text-emerald-950">Pistas</h1>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {["Pista 1", "Pista 2", "Pista 3", "Pista 4"].map((court) => (
            <Card key={court}>
              <CardContent className="font-semibold">{court}</CardContent>
            </Card>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
