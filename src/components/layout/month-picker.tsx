"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { MESES } from "@/lib/calendar";

/** Título do calendário que também escolhe o mês: duas listas (mês e
 * ano) que levam direto para ?mes=AAAA-MM, mantendo os outros filtros
 * da URL (aba, cliente, status...). Lista nativa para funcionar em
 * qualquer lugar, inclusive dentro de janelas. */
export function MonthPicker({ ano, mes }: { ano: number; mes: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendente, startTransition] = useTransition();

  const anoAtual = new Date().getFullYear();
  const anos = Array.from(new Set([anoAtual - 2, anoAtual - 1, anoAtual, anoAtual + 1, anoAtual + 2, ano])).sort();

  function ir(novoAno: number, novoMes: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mes", `${novoAno}-${String(novoMes).padStart(2, "0")}`);
    startTransition(() => router.push(`?${params.toString()}`, { scroll: false }));
  }

  const select =
    "cursor-pointer appearance-none rounded-md bg-transparent py-0.5 pr-6 pl-1.5 text-lg [field-sizing:content] font-semibold text-brand-900 outline-none transition hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-ring/50";

  return (
    <div className="flex items-center gap-1">
      <div className="relative">
        <select aria-label="Mês" value={mes} onChange={(e) => ir(ano, Number(e.target.value))} className={select}>
          {MESES.map((nome, i) => (
            <option key={nome} value={i + 1}>
              {nome}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 text-brand-600" />
      </div>
      <div className="relative">
        <select aria-label="Ano" value={ano} onChange={(e) => ir(Number(e.target.value), mes)} className={select}>
          {anos.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 text-brand-600" />
      </div>
      {pendente && <Loader2 size={16} className="ml-1 animate-spin text-brand-600" aria-label="Carregando" />}
    </div>
  );
}
