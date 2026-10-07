"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PERIODOS } from "@/lib/periodo";

type Opcao = { value: string; label: string };

/** Filtros por querystring (?periodo=&area=&responsavel=) -- o
 * dashboard e' server component, so precisa recarregar com os params. */
export function DashboardFilterBar({ areas, membros }: { areas: Opcao[]; membros: Opcao[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "todos") params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const filtros: { key: string; todos: string; opcoes: Opcao[]; largura: string }[] = [
    { key: "periodo", todos: "Todo o período", opcoes: PERIODOS.map((p) => ({ value: p.value, label: p.label })), largura: "w-44" },
    { key: "area", todos: "Todas as áreas", opcoes: areas, largura: "w-44" },
    { key: "responsavel", todos: "Todos os responsáveis", opcoes: membros, largura: "w-52" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filtros.map((f) => {
        const items = [{ value: "todos", label: f.todos }, ...f.opcoes];
        return (
          <Select
            key={f.key}
            value={searchParams.get(f.key) ?? "todos"}
            onValueChange={(v) => setParam(f.key, v as string)}
            items={items}
          >
            <SelectTrigger className={`h-9 text-sm ${f.largura}`} aria-label={f.todos}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      })}
    </div>
  );
}
