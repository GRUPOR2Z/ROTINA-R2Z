"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, FileText, KeyRound, ListChecks, Workflow } from "lucide-react";
import { cn } from "@/lib/utils";

const ABAS = [
  { valor: "conteudo", rotulo: "Calendário de conteúdo", icone: CalendarDays },
  { valor: "tarefas", rotulo: "Tarefas", icone: ListChecks },
  { valor: "processos", rotulo: "Processos", icone: Workflow },
  { valor: "roteiros", rotulo: "Roteiros", icone: FileText },
  { valor: "acessos", rotulo: "Acessos", icone: KeyRound },
] as const;

type Aba = (typeof ABAS)[number]["valor"];

function abaValida(valor: string): valor is Aba {
  return ABAS.some((a) => a.valor === valor);
}

/** Todas as 3 abas ficam montadas o tempo todo -- trocar de aba só
 * alterna qual `<div>` fica visível (via `hidden`), então nenhum
 * formulário ou estado dentro delas é perdido na troca. A URL
 * (`?tab=`) só existe pra deixar a aba atual compartilhável/persistir
 * num refresh, não é ela quem decide o que fica montado. */
export function ClientTabs({
  abaInicial,
  conteudo,
  tarefas,
  processos,
  roteiros,
  acessos,
}: {
  abaInicial: string;
  conteudo: ReactNode;
  tarefas: ReactNode;
  processos: ReactNode;
  roteiros: ReactNode;
  acessos: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [abaAtiva, setAbaAtiva] = useState<Aba>(abaValida(abaInicial) ? abaInicial : "conteudo");

  function selecionar(aba: Aba) {
    setAbaAtiva(aba);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", aba);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const paineis: Record<Aba, ReactNode> = { conteudo, tarefas, processos, roteiros, acessos };

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="inline-flex w-fit flex-wrap gap-1 rounded-lg bg-muted p-1">
        {ABAS.map(({ valor, rotulo, icone: Icone }) => (
          <button
            key={valor}
            type="button"
            role="tab"
            aria-selected={abaAtiva === valor}
            onClick={() => selecionar(valor)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition",
              abaAtiva === valor
                ? "bg-card text-brand-900 shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icone size={15} className={abaAtiva === valor ? "text-brand-600" : ""} />
            {rotulo}
          </button>
        ))}
      </div>

      {ABAS.map((aba) => (
        <div key={aba.valor} className={abaAtiva === aba.valor ? "block" : "hidden"}>
          {paineis[aba.valor]}
        </div>
      ))}
    </div>
  );
}
