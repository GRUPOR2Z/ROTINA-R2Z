"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "todos", label: "Todos os status" },
  { value: "rascunho", label: "Rascunho" },
  { value: "revisao", label: "Em revisão" },
  { value: "publicado", label: "Publicado" },
  { value: "arquivado", label: "Arquivado" },
];

export function ProcessFilterBar({ areas }: { areas: { id: string; nome: string }[] }) {
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
      <Input
        placeholder="Buscar por título…"
        defaultValue={searchParams.get("busca") ?? ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") setParam("busca", e.currentTarget.value);
        }}
        onBlur={(e) => setParam("busca", e.currentTarget.value)}
        className="h-9 w-56 text-sm"
      />

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
    </div>
  );
}
