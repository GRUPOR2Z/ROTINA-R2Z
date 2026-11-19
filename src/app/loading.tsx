"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/nav-links";

/** Aparece na hora do clique enquanto o servidor monta a pagina: o menu
 * continua no lugar e o conteudo vira um esqueleto. Sem isso o Next
 * espera a pagina inteira (todas as consultas) antes de trocar de tela
 * e o clique parece travado. */
export default function Loading() {
  const pathname = usePathname();
  if (["/login", "/signup", "/portal"].some((p) => pathname.startsWith(p))) return null;

  return (
    <div className="min-h-screen bg-background lg:flex">
      <Sidebar
        usuario={
          <div className="flex items-center gap-3">
            <span className="size-8 shrink-0 animate-pulse rounded-full bg-white/10" />
            <div className="flex-1 space-y-1.5">
              <span className="block h-3 w-28 animate-pulse rounded bg-white/10" />
              <span className="block h-2.5 w-16 animate-pulse rounded bg-white/10" />
            </div>
          </div>
        }
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8" aria-busy="true" aria-label="Carregando">
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <div className="h-7 w-56 animate-pulse rounded-md bg-brand-100" />
            <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-brand-100/70" />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-xl border border-border bg-card" />
        </div>
      </main>
    </div>
  );
}
