import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";

export default function MembersPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold text-emerald-950">Miembros</h1>
        <Card className="mt-5">
          <CardContent>owner · admin · organizer · scorer · member</CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
