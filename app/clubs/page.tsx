import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";

export default function ClubsPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-bold text-emerald-950">Clubes</h1>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Link href="/clubs/club-demo">
            <Card>
              <CardContent>
                <h2 className="font-semibold">Club Demo Centro</h2>
                <p className="mt-2 text-sm text-slate-600">4 pistas activas, roles y competiciones privadas.</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
