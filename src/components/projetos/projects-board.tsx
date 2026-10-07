"use client";

import { useState, useTransition, type DragEvent } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BarraAndamento, PrazoProjeto } from "@/components/projetos/status-badge";
import { mudarStatusProjeto } from "@/app/projetos/actions";
import { STATUS_PROJETO, type StatusProjeto } from "@/lib/projetos";
import { cn } from "@/lib/utils";

export type CardProjeto = {
  id: string;
  nome: string;
  status: string;
  prazo: string | null;
  responsavel: string;
  andamento: number | null;
};

/** Kanban de projetos por status, com arrastar e soltar (mesmo
 * padrao do quadro de tarefas do cliente). */
export function ProjectsBoard({ projetos: iniciais }: { projetos: CardProjeto[] }) {
  const [anteriores, setAnteriores] = useState(iniciais);
  const [projetos, setProjetos] = useState(iniciais);
  const [alvo, setAlvo] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (iniciais !== anteriores) {
    setAnteriores(iniciais);
    setProjetos(iniciais);
  }

  function mover(id: string, status: StatusProjeto) {
    setProjetos((atual) => atual.map((p) => (p.id === id ? { ...p, status } : p)));
    startTransition(() => {
      mudarStatusProjeto(id, status);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {STATUS_PROJETO.map((col) => {
        const itens = projetos.filter((p) => p.status === col.value);
        return (
          <div
            key={col.value}
            onDragOver={(e: DragEvent) => {
              e.preventDefault();
              setAlvo(col.value);
            }}
            onDragLeave={() => setAlvo((a) => (a === col.value ? null : a))}
            onDrop={(e: DragEvent) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              if (id) mover(id, col.value);
              setAlvo(null);
            }}
            className={cn(
              "flex flex-col gap-3 rounded-xl border bg-muted/30 p-3 transition-colors",
              alvo === col.value && "border-primary/50 bg-primary/5",
            )}
          >
            <div className="flex items-center gap-2 px-1">
              <span className={cn("h-2 w-2 rounded-full", col.dot)} />
              <h3 className="text-sm font-medium">{col.label}</h3>
              <Badge variant="secondary" className="ml-auto">
                {itens.length}
              </Badge>
            </div>
            {itens.map((p) => (
              <Link
                key={p.id}
                href={`/projetos/${p.id}`}
                draggable
                onDragStart={(e: DragEvent) => {
                  e.dataTransfer.setData("text/plain", p.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                className="flex cursor-grab flex-col gap-2 rounded-lg border bg-card p-3 text-sm shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
              >
                <span className="font-medium">{p.nome}</span>
                <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{p.responsavel}</span>
                  <PrazoProjeto prazo={p.prazo} status={p.status} />
                </span>
                <BarraAndamento valor={p.andamento} />
              </Link>
            ))}
          </div>
        );
      })}
    </div>
  );
}
