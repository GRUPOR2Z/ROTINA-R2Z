export const TIPOS_ACHADO = [
  { value: "fato", label: "Fatos", descricao: "O que os dados mostram." },
  { value: "hipotese", label: "Hipóteses", descricao: "Possíveis explicações — ainda não confirmadas." },
  { value: "problema", label: "Possíveis problemas", descricao: "Desvios que merecem atenção." },
  { value: "recomendacao", label: "Recomendações", descricao: "Sugestões — a decisão é sempre humana." },
] as const;

export const CATEGORIAS_ACHADO: Record<string, string> = {
  atrasos: "Atrasos",
  retrabalho: "Retrabalho",
  indicadores: "Indicadores",
  metas: "Metas",
  processos: "Processos",
  distribuicao: "Distribuição de tarefas",
  outro: "Outro",
};

export type Achado = { tipo: string; prioridade: string; validacao: string };

const PESO_PRIORIDADE: Record<string, number> = { alta: 0, media: 1, baixa: 2 };

/** Agrupa achados por tipo (na ordem fato -> hipotese -> problema ->
 * recomendacao) e ordena cada grupo por prioridade. */
export function agruparAchados<T extends Achado>(achados: T[]) {
  return TIPOS_ACHADO.map((tipo) => ({
    ...tipo,
    itens: achados
      .filter((a) => a.tipo === tipo.value)
      .sort((a, b) => (PESO_PRIORIDADE[a.prioridade] ?? 9) - (PESO_PRIORIDADE[b.prioridade] ?? 9)),
  }));
}

export function resumoValidacao(achados: Achado[]) {
  return {
    pendentes: achados.filter((a) => a.validacao === "pendente").length,
    validados: achados.filter((a) => a.validacao === "validado").length,
    rejeitados: achados.filter((a) => a.validacao === "rejeitado").length,
  };
}
