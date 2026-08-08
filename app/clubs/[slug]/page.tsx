import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ClubPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-bold text-emerald-950">Club Demo Centro</h1>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {["players", "courts", "members", "settings"].map((section) => (
            <Link key={section} href={`/clubs/club-demo/${section}`}>
              <Card>
                <CardHeader>
                  <h2 className="font-semibold capitalize">{section}</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">Gestion con permisos de club.</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
