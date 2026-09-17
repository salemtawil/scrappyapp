import Link from "next/link";
import { Building2, PlusCircle, Trophy, Users } from "lucide-react";
import { productConfig } from "@/lib/config/product";
import { es } from "@/lib/i18n/es";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8faf8]">
      <header className="sticky top-0 z-20 border-b border-emerald-950/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-emerald-950">
            <span className="grid size-9 place-items-center rounded-md bg-emerald-700 text-white">
              <Trophy size={18} />
            </span>
            {productConfig.name}
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-emerald-50" href="/dashboard">
              {es.nav.dashboard}
            </Link>
            <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-emerald-50" href="/players">
              <Users size={16} className="mr-1 inline" />
              {es.nav.players}
            </Link>
            <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-emerald-50" href="/clubs">
              <Building2 size={16} className="mr-1 inline" />
              {es.nav.clubs}
            </Link>
            <Link
              className="ml-2 inline-flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800"
              href="/competitions/new"
            >
              <PlusCircle size={16} />
              {es.nav.create}
            </Link>
          </nav>
        </div>
        <nav className="mx-auto grid max-w-6xl grid-cols-4 gap-1 border-t border-emerald-950/10 px-2 py-2 md:hidden">
          <Link className="rounded-md px-2 py-2 text-center text-xs font-semibold text-emerald-950" href="/dashboard">
            Panel
          </Link>
          <Link className="rounded-md px-2 py-2 text-center text-xs font-semibold text-emerald-950" href="/players">
            Jugadores
          </Link>
          <Link className="rounded-md px-2 py-2 text-center text-xs font-semibold text-emerald-950" href="/clubs">
            Clubs
          </Link>
          <Link className="rounded-md bg-emerald-700 px-2 py-2 text-center text-xs font-semibold text-white" href="/competitions/new">
            Crear
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
