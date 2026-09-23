"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/clientes", label: "Clientes" },
  { href: "/rotinas", label: "Rotinas" },
  { href: "/processos", label: "Processos" },
  { href: "/kpis", label: "KPIs" },
  { href: "/okrs", label: "OKRs" },
  { href: "/equipe", label: "Equipe" },
] as const;

function navLinkClass(active: boolean) {
  return cn(
    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={navLinkClass(active)}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Fica separado no rodapé da barra lateral (junto do usuário/Sair),
 * não misturado com a navegação principal. */
export function SettingsLink() {
  const pathname = usePathname();
  const active = pathname.startsWith("/configuracoes");

  return (
    <Link href="/configuracoes" className={navLinkClass(active)}>
      Configurações
    </Link>
  );
}
