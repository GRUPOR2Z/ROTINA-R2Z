"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Gavel,
  GraduationCap,
  KanbanSquare,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Menu,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; tambem?: string[] };

type Grupo = { titulo?: string; itens: Item[] };

/** Menu organizado pelo ciclo do Doc. 1: Planejar/Executar → Registrar
 * → Medir → Melhorar. */
const GRUPOS: Grupo[] = [
  {
    itens: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/alertas", label: "Alertas", icon: Bell },
    ],
  },
  {
    titulo: "Dia a dia",
    itens: [
      { href: "/rotinas", label: "Rotinas", icon: ListChecks },
      { href: "/projetos", label: "Projetos", icon: KanbanSquare },
      { href: "/clientes", label: "Clientes", icon: Building2 },
      { href: "/conteudo", label: "Conteúdo", icon: CalendarDays },
    ],
  },
  {
    titulo: "Conhecimento",
    itens: [
      { href: "/processos", label: "Processos", icon: Workflow },
      { href: "/decisoes", label: "Decisões e reuniões", icon: Gavel, tambem: ["/reunioes"] },
      { href: "/onboarding", label: "Onboarding", icon: GraduationCap },
    ],
  },
  {
    titulo: "Resultados",
    itens: [
      { href: "/kpis", label: "KPIs", icon: BarChart3 },
      { href: "/okrs", label: "OKRs", icon: Target },
    ],
  },
  {
    titulo: "Melhoria contínua",
    itens: [
      { href: "/melhorias", label: "Melhorias", icon: Lightbulb },
      { href: "/ia", label: "Grupo R2Z IA", icon: Sparkles },
    ],
  },
];

/** Rodapé do menu: gestão da própria organização. */
const ORGANIZACAO: Item[] = [
  { href: "/equipe", label: "Equipe", icon: Users },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

function isActive(item: Item, pathname: string) {
  if (item.href === "/") return pathname === "/";
  return [item.href, ...(item.tambem ?? [])].some((h) => pathname === h || pathname.startsWith(h + "/"));
}

function NavLink({ item, active, contador }: { item: Item; active: boolean; contador?: number }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition",
        active ? "bg-white/10 font-medium text-white" : "hover:bg-white/5 hover:text-white",
      )}
    >
      {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-mint" />}
      <Icon size={16} className={active ? "text-mint" : ""} />
      <span className="flex-1 truncate">{item.label}</span>
      {(contador ?? 0) > 0 && (
        <span className="min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[11px] leading-none font-semibold text-white tabular-nums">
          {contador}
        </span>
      )}
    </Link>
  );
}

/** Barra lateral verde (mesmo visual do dashboard comercial). No celular e
 * tablet ela fica recolhida atrás do botão ☰. */
export function Sidebar({
  contadores = {},
  usuario,
}: {
  contadores?: Record<string, number>;
  usuario: ReactNode;
}) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-brand-900 px-4 text-white lg:hidden">
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          className="-ml-2 rounded-md p-2 hover:bg-white/10"
        >
          <Menu size={20} />
        </button>
        <Image src="/logo-r2z-branco.png" alt="Grupo R2Z" width={298} height={170} className="w-7" />
        <span className="truncate text-sm font-medium">Gestão operacional</span>
      </div>
      {aberto && (
        <div onClick={() => setAberto(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" aria-hidden="true" />
      )}

      <aside
        // fecha ao escolher um destino no menu (celular)
        onClick={(e) => (e.target as HTMLElement).closest("a") && setAberto(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-64 shrink-0 flex-col bg-brand-900 text-brand-200 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          aberto ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="border-b border-white/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Image src="/logo-r2z-branco.png" alt="Grupo R2Z" width={298} height={170} className="w-9" priority />
            <div className="leading-tight">
              <p className="text-[10px] font-medium tracking-[0.18em] text-mint uppercase">Grupo R2Z</p>
              <p className="text-sm font-semibold text-white">Gestão operacional</p>
            </div>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar menu"
              className="ml-auto rounded-md p-1.5 text-brand-200 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X size={18} />
            </button>
          </div>
          <form action="/busca" role="search" className="relative">
            <Search size={14} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-brand-300" />
            <input
              name="q"
              type="search"
              placeholder="Buscar…"
              aria-label="Busca global"
              className="h-8 w-full rounded-md border border-white/10 bg-white/5 pr-2.5 pl-8 text-sm text-white outline-none placeholder:text-brand-300 focus-visible:border-mint/60 focus-visible:ring-2 focus-visible:ring-mint/20"
            />
          </form>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-2">
          {GRUPOS.map((grupo, i) => (
            <div key={grupo.titulo ?? i} className="space-y-0.5">
              {grupo.titulo && (
                <p className="px-3 pb-1 text-[10px] font-medium tracking-[0.16em] text-brand-300/80 uppercase">
                  {grupo.titulo}
                </p>
              )}
              {grupo.itens.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item, pathname)} contador={contadores[item.href]} />
              ))}
            </div>
          ))}
        </nav>

        <div className="space-y-0.5 border-t border-white/10 p-2">
          {ORGANIZACAO.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item, pathname)} />
          ))}
        </div>

        <div className="border-t border-white/10 p-4">{usuario}</div>
      </aside>
    </>
  );
}
