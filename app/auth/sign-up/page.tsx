import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SignUpPage() {
  return (
    <AppShell>
      <main className="mx-auto grid min-h-[calc(100vh-70px)] max-w-md place-items-center px-4">
        <Card className="w-full">
          <CardHeader>
            <h1 className="text-2xl font-bold">Crear cuenta</h1>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Nombre visible" />
            <Input type="email" placeholder="correo@club.com" />
            <Input type="password" placeholder="Contrasena" />
            <Button className="w-full" type="button">
              Crear cuenta
            </Button>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
