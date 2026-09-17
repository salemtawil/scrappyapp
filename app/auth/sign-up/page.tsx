import { AppShell } from "@/components/app-shell";
import { signUpAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/dashboard" } = await searchParams;

  return (
    <AppShell>
      <main className="mx-auto grid min-h-[calc(100vh-70px)] max-w-md place-items-center px-4">
        <Card className="w-full">
          <CardHeader>
            <h1 className="text-2xl font-bold">Crear cuenta</h1>
          </CardHeader>
          <CardContent>
            <AuthForm action={signUpAction} mode="sign-up" next={next} />
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
