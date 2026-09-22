"use client";

import { useRef, useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CircleIcon,
  CircleDotIcon,
  CheckCircle2Icon,
  PlusIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { atualizarStatus, criarTarefaRapida } from "@/app/rotinas/actions";
import { infoCor } from "@/lib/task-colors";
import { cn } from "@/lib/utils";

type Tarefa = {
  id: string;
  titulo: string;
  status: string;
  prazo: string | null;
  horario: string | null;
  cor: string | null;
};

// 3 colunas como no pedido original (Notion): em_andamento e bloqueada
// ficam juntas na coluna do meio -- o status de bloqueio ja aparece no
// badge do card, nao precisa de uma 4a coluna so pra isso.
const COLUNAS = [
  { valor: "pendente", rotulo: "Não iniciado", dot: "bg-muted-foreground/50", Icone: CircleIcon },
  { valor: "em_andamento", rotulo: "Em andamento", dot: "bg-blue-500", Icone: CircleDotIcon },
  { valor: "concluida", rotulo: "Concluído", dot: "bg-emerald-500", Icone: CheckCircle2Icon },
] as const;

type StatusColuna = (typeof COLUNAS)[number]["valor"];

function colunaDaTarefa(status: string): StatusColuna {
  if (status === "concluida") return "concluida";
  if (status === "pendente") return "pendente";
  return "em_andamento";
}

function estaAtrasada(prazo: string | null, status: string) {
  if (!prazo || status === "concluida") return false;
  return new Date(prazo) < new Date(new Date().toDateString());
}

export function ClientTasksBoard({ clientId, tarefas: tarefasIniciais }: { clientId: string; tarefas: Tarefa[] }) {
  const router = useRouter();
  const [tarefasAnteriores, setTarefasAnteriores] = useState(tarefasIniciais);
  const [tarefas, setTarefas] = useState(tarefasIniciais);
  const [, startTransition] = useTransition();
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<StatusColuna | null>(null);
  const proximoIdTemporario = useRef(0);

  // sincroniza quando o servidor manda dado novo (ex: revalidatePath
  // depois de editar a tarefa em /rotinas/[id]) -- sem isso o board
  // ficaria preso no estado otimista do primeiro carregamento. Ajuste
  // durante o render (não em useEffect) é o jeito recomendado pelo
  // React pra "resetar estado quando uma prop muda".
  if (tarefasIniciais !== tarefasAnteriores) {
    setTarefasAnteriores(tarefasIniciais);
    setTarefas(tarefasIniciais);
  }

  function moverTarefa(taskId: string, novoStatus: StatusColuna) {
    setTarefas((atual) => atual.map((t) => (t.id === taskId ? { ...t, status: novoStatus } : t)));
    startTransition(() => {
      atualizarStatus(taskId, novoStatus);
    });
  }

  function adicionarTarefa(coluna: StatusColuna, titulo: string) {
    const idTemporario = `temp-${proximoIdTemporario.current++}`;
    setTarefas((atual) => [
      ...atual,
      { id: idTemporario, titulo, status: coluna, prazo: null, horario: null, cor: null },
    ]);
    startTransition(async () => {
      const criada = await criarTarefaRapida(clientId, coluna, titulo);
      setTarefas((atual) =>
        criada
          ? atual.map((t) => (t.id === idTemporario ? criada : t))
          : atual.filter((t) => t.id !== idTemporario),
      );
    });
  }

  const porColuna = new Map<StatusColuna, Tarefa[]>(COLUNAS.map((c) => [c.valor, []]));
  for (const tarefa of tarefas) porColuna.get(colunaDaTarefa(tarefa.status))!.push(tarefa);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {COLUNAS.map((coluna) => {
        const itens = porColuna.get(coluna.valor) ?? [];
        const emArrastoAqui = colunaAlvo === coluna.valor;

        return (
          <div
            key={coluna.valor}
            onDragOver={(e: DragEvent) => {
              e.preventDefault();
              setColunaAlvo(coluna.valor);
            }}
            onDragLeave={() => setColunaAlvo((atual) => (atual === coluna.valor ? null : atual))}
            onDrop={(e: DragEvent) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData("text/plain");
              if (taskId) moverTarefa(taskId, coluna.valor);
              setArrastandoId(null);
              setColunaAlvo(null);
            }}
            className={cn(
              "flex flex-col gap-3 rounded-xl border bg-muted/30 p-3 transition-colors",
              emArrastoAqui && "border-primary/50 bg-primary/5",
            )}
          >
            <div className="flex items-center gap-2 px-1">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", coluna.dot)} />
              <h3 className="text-sm font-medium">{coluna.rotulo}</h3>
              <Badge variant="secondary" className="ml-auto">
                {itens.length}
              </Badge>
            </div>

            <div className="flex flex-col gap-2">
              {itens.map((tarefa) => {
                const atrasada = estaAtrasada(tarefa.prazo, tarefa.status);
                const cor = infoCor(tarefa.cor);

                return (
                  <div
                    key={tarefa.id}
                    draggable
                    onDragStart={(e: DragEvent) => {
                      e.dataTransfer.setData("text/plain", tarefa.id);
                      e.dataTransfer.effectAllowed = "move";
                      setArrastandoId(tarefa.id);
                    }}
                    onDragEnd={() => setArrastandoId(null)}
                    onClick={() => router.push(`/rotinas/${tarefa.id}`)}
                    className={cn(
                      "group flex cursor-grab items-start gap-2 rounded-lg border bg-card p-2.5 text-sm shadow-sm transition-all hover:shadow-md active:cursor-grabbing",
                      arrastandoId === tarefa.id && "opacity-40",
                    )}
                  >
                    <coluna.Icone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-center gap-1.5 font-medium">
                        {cor && <span className={cn("inline-block h-2 w-2 shrink-0 rounded-full", cor.dot)} />}
                        {tarefa.titulo}
                      </span>
                      {(tarefa.prazo || tarefa.status === "bloqueada") && (
                        <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          {tarefa.prazo && (
                            <span className={atrasada ? "font-medium text-destructive" : ""}>
                              {new Date(tarefa.prazo).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                              {tarefa.horario && ` · ${tarefa.horario.slice(0, 5)}`}
                            </span>
                          )}
                          {tarefa.status === "bloqueada" && <Badge variant="destructive">Bloqueada</Badge>}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              <NovaTarefaInline onCriar={(titulo) => adicionarTarefa(coluna.valor, titulo)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NovaTarefaInline({ onCriar }: { onCriar: (titulo: string) => void }) {
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function confirmar() {
    const limpo = titulo.trim();
    if (limpo) onCriar(limpo);
    setTitulo("");
    setAberto(false);
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => {
          setAberto(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        Adicionar tarefa
      </button>
    );
  }

  return (
    <Input
      ref={inputRef}
      value={titulo}
      onChange={(e) => setTitulo(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") confirmar();
        if (e.key === "Escape") {
          setTitulo("");
          setAberto(false);
        }
      }}
      onBlur={confirmar}
      placeholder="Título da tarefa…"
      className="h-8 text-sm"
    />
  );
}
