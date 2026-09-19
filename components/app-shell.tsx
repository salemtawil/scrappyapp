import Link from "next/link";
import { Building2, LayoutDashboard, PlusCircle, Trophy, Users } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { DesktopNav, MobileNav, type NavItem } from "@/components/nav-links";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { productConfig } from "@/lib/config/product";

const navItems: NavItem[] = [
  { href: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Panel" },
  { href: "/players", icon: <Users size={18} />, label: "Jugadores" },
  { href: "/clubs", icon: <Building2 size={18} />, label: "Clubes" },
  { href: "/competitions/new", icon: <PlusCircle size={18} />, label: "Crear" },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
        href="#contenido"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <Link className="flex items-center gap-2 font-bold text-foreground" href="/">
            <span aria-hidden className="grid size-9 place-items-center rounded-lg bg-brand text-white">
              <Trophy size={18} />
            </span>
            <span className="truncate">{productConfig.name}</span>
          </Link>
          <nav aria-label="Principal" className="contents">
            <DesktopNav items={navItems} />
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <form action={signOutAction}>
                <Button type="submit" variant="secondary">
                  Salir
                </Button>
              </form>
            ) : (
              <Link href="/auth/login">
                <Button variant="secondary">Entrar</Button>
              </Link>
            )}
          </div>
        </div>
      </header>
      <div className="flex-1 pb-20 md:pb-0" id="contenido">
        {children}
      </div>
      <MobileNav items={navItems} />
    </div>
  );
}
