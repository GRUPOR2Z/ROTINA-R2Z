"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const ABAS = [
  { valor: "conteudo", rotulo: "Conteúdo" },
  { valor: "tarefas", rotulo: "Controle de tarefas" },
  { valor: "processos", rotulo: "Processos" },
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
}: {
  abaInicial: string;
  conteudo: ReactNode;
  tarefas: ReactNode;
  processos: ReactNode;
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

  const paineis: Record<Aba, ReactNode> = { conteudo, tarefas, processos };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 border-b">
        {ABAS.map((aba) => (
          <button
            key={aba.valor}
            type="button"
            onClick={() => selecionar(aba.valor)}
            className={cn(
              "rounded-t-md px-3 py-2 text-sm font-medium transition-colors",
              abaAtiva === aba.valor
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {aba.rotulo}
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
