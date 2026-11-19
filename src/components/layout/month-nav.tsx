import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Navegação de mês ‹ Hoje › num grupo único (calendários do cliente,
 * do portal e da visão geral de conteúdo). */
export function MonthNav({ anterior, hoje, proximo }: { anterior: string; hoje: string; proximo: string }) {
  const seta =
    "flex size-8 items-center justify-center rounded-md text-brand-800 transition hover:bg-brand-50 hover:text-brand-900";
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 shadow-xs">
      <Link href={anterior} aria-label="Mês anterior" title="Mês anterior" className={seta}>
        <ChevronLeft size={16} />
      </Link>
      <Link
        href={hoje}
        className="flex h-8 items-center rounded-md px-3 text-sm font-medium text-brand-900 transition hover:bg-brand-50"
      >
        Hoje
      </Link>
      <Link href={proximo} aria-label="Próximo mês" title="Próximo mês" className={seta}>
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}
