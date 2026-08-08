import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <AppShell>
      <main className="mx-auto grid min-h-[calc(100vh-70px)] max-w-md place-items-center px-4">
        <Card className="w-full">
          <CardHeader>
            <h1 className="text-2xl font-bold">Entrar</h1>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="email" placeholder="correo@club.com" />
            <Input type="password" placeholder="Contrasena" />
            <Button className="w-full" type="button">
              Entrar
            </Button>
            <p className="text-center text-sm text-slate-600">
              Sin cuenta?{" "}
              <Link className="font-semibold text-emerald-700" href="/auth/sign-up">
                Crear cuenta
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
