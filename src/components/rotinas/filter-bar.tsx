"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos os status" },
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "bloqueada", label: "Bloqueada" },
];

export function FilterBar({
  areas,
  membros,
}: {
  areas: { id: string; nome: string }[];
  membros: { id: string; nome: string | null; email: string | null }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "todos") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={searchParams.get("status") ?? "todos"}
        onValueChange={(v) => setParam("status", v)}
      >
        <SelectTrigger className="h-9 w-44 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("area") ?? "todos"}
        onValueChange={(v) => setParam("area", v)}
      >
        <SelectTrigger className="h-9 w-44 text-sm">
          <SelectValue placeholder="Todas as áreas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas as áreas</SelectItem>
          {areas.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("responsavel") ?? "todos"}
        onValueChange={(v) => setParam("responsavel", v)}
      >
        <SelectTrigger className="h-9 w-48 text-sm">
          <SelectValue placeholder="Todos os responsáveis" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os responsáveis</SelectItem>
          {membros.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.nome || m.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
