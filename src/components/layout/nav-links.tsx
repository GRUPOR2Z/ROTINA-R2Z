"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; tambem?: string[] };

const ITEMS: Item[] = [
  { href: "/", label: "Dashboard" },
  { href: "/clientes", label: "Clientes" },
  { href: "/rotinas", label: "Rotinas" },
  { href: "/projetos", label: "Projetos" },
  { href: "/decisoes", label: "Decisões e reuniões", tambem: ["/reunioes"] },
  { href: "/processos", label: "Processos" },
  { href: "/kpis", label: "KPIs" },
  { href: "/okrs", label: "OKRs" },
  { href: "/melhorias", label: "Melhorias" },
  { href: "/equipe", label: "Equipe" },
  { href: "/onboarding", label: "Onboarding" },
];

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
        const active =
          item.href === "/"
            ? pathname === "/"
            : [item.href, ...(item.tambem ?? [])].some((h) => pathname.startsWith(h));
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
