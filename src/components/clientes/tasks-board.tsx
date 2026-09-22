import Link from "next/link";
import { StatusBadge, estaAtrasada } from "@/components/rotinas/status-badge";
import { infoCor } from "@/lib/task-colors";

type Tarefa = {
  id: string;
  titulo: string;
  status: string;
  prazo: string | null;
  horario: string | null;
  cor: string | null;
};

// 3 colunas como no pedido original (Notion): em_andamento e bloqueada
// ficam juntas na coluna do meio porque o status de bloqueio ja aparece
// no badge do card -- nao precisa de uma 4a coluna so pra isso.
const COLUNAS = [
  { valor: "pendente", rotulo: "Não iniciado" },
  { valor: "em_andamento", rotulo: "Em andamento" },
  { valor: "concluida", rotulo: "Concluído" },
] as const;

function colunaDaTarefa(status: string) {
  if (status === "concluida") return "concluida";
  if (status === "pendente") return "pendente";
  return "em_andamento";
}

export function ClientTasksBoard({ tarefas }: { tarefas: Tarefa[] }) {
  const porColuna = new Map<string, Tarefa[]>(COLUNAS.map((c) => [c.valor, []]));
  for (const tarefa of tarefas) {
    porColuna.get(colunaDaTarefa(tarefa.status))!.push(tarefa);
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {COLUNAS.map((coluna) => {
        const itens = porColuna.get(coluna.valor) ?? [];
        return (
          <div key={coluna.valor} className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{coluna.rotulo}</h3>
              <span className="text-xs text-muted-foreground">{itens.length}</span>
            </div>

            <div className="flex flex-col gap-2">
              {itens.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma tarefa.</p>}
              {itens.map((tarefa) => {
                const atrasada = estaAtrasada(tarefa.prazo, tarefa.status);
                return (
                  <Link
                    key={tarefa.id}
                    href={`/rotinas/${tarefa.id}`}
                    className="flex flex-col gap-1.5 rounded-md border bg-card p-2.5 text-sm transition-colors hover:bg-muted/50"
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      {tarefa.cor && (
                        <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${infoCor(tarefa.cor)?.dot}`} />
                      )}
                      {tarefa.titulo}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      {tarefa.prazo && (
                        <span className={atrasada ? "font-medium text-destructive" : ""}>
                          {new Date(tarefa.prazo).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          {tarefa.horario && ` · ${tarefa.horario.slice(0, 5)}`}
                        </span>
                      )}
                      {tarefa.status === "bloqueada" && <StatusBadge status="bloqueada" />}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
