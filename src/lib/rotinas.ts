export type TarefaParaFiltro = {
  id: string;
  status: string;
  prazo: string | null;
};

/**
 * Numa lista de tarefas, esconde ocorrências futuras "pendente" de uma
 * mesma rotina recorrente, mantendo só a mais próxima. Tarefas em
 * andamento, concluídas ou bloqueadas sempre aparecem — só a fila de
 * pendentes ainda distantes é que fica de fora da lista (mas continua
 * existindo e aparece no calendário).
 */
export function filtrarProximasPendentes<T extends TarefaParaFiltro>(
  tarefas: T[],
  rotinaPorTarefa: Map<string, string>,
): T[] {
  const menorPrazoPorRotina = new Map<string, string>();

  for (const t of tarefas) {
    const rotinaId = rotinaPorTarefa.get(t.id);
    if (!rotinaId || t.status !== "pendente" || !t.prazo) continue;
    const atual = menorPrazoPorRotina.get(rotinaId);
    if (!atual || t.prazo < atual) menorPrazoPorRotina.set(rotinaId, t.prazo);
  }

  return tarefas.filter((t) => {
    const rotinaId = rotinaPorTarefa.get(t.id);
    if (!rotinaId) return true;
    if (t.status !== "pendente") return true;
    return t.prazo === menorPrazoPorRotina.get(rotinaId);
  });
}
