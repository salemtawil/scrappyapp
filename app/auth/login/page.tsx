import { AppShell } from "@/components/app-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { signInAction } from "@/app/auth/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/dashboard" } = await searchParams;

  return (
    <AppShell>
      <main className="mx-auto grid min-h-[calc(100vh-70px)] max-w-md place-items-center px-4">
        <Card className="w-full">
          <CardHeader>
            <h1 className="text-2xl font-bold">Entrar</h1>
          </CardHeader>
          <CardContent>
            <AuthForm action={signInAction} mode="login" next={next} />
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
