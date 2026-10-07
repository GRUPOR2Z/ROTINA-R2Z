export const TIPOS_ALERTA = [
  { value: "tarefa_atrasada", label: "Tarefas atrasadas" },
  { value: "prazo_proximo", label: "Prazos próximos" },
  { value: "processo_revisao", label: "Processos (revisão/substituto)" },
  { value: "kpi_desatualizado", label: "KPIs desatualizados" },
  { value: "falha_integracao", label: "Falhas de integração" },
  { value: "ia", label: "Achados da IA" },
  { value: "manual", label: "Manuais" },
] as const;

export function rotuloTipoAlerta(tipo: string) {
  return TIPOS_ALERTA.find((t) => t.value === tipo)?.label ?? tipo;
}

export const ORDEM_SEVERIDADE: Record<string, number> = { critico: 0, atencao: 1, info: 2 };

type AlertaOrdenavel = { severidade: string; criado_em: string; lido_em: string | null };

/** Nao lidos primeiro, depois critico > atencao > info, depois mais novo. */
export function ordenarAlertas<T extends AlertaOrdenavel>(alertas: T[]) {
  return [...alertas].sort((a, b) => {
    if (!a.lido_em !== !b.lido_em) return a.lido_em ? 1 : -1;
    const s = (ORDEM_SEVERIDADE[a.severidade] ?? 9) - (ORDEM_SEVERIDADE[b.severidade] ?? 9);
    if (s !== 0) return s;
    return b.criado_em.localeCompare(a.criado_em);
  });
}
