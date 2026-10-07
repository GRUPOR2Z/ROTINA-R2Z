const ROTULOS_CAMPO: Record<string, string> = {
  titulo: "título",
  nome: "nome",
  descricao: "descrição",
  status: "status",
  prioridade: "prioridade",
  prazo: "prazo",
  horario: "horário",
  responsavel_id: "responsável",
  area_id: "área",
  bloqueio_motivo: "motivo do bloqueio",
  concluida_em: "conclusão",
  cor: "cor",
  client_id: "cliente",
  project_id: "projeto",
  process_id: "processo",
  kpi_id: "KPI",
  okr_id: "OKR",
  parent_task_id: "tarefa-mãe",
  justificativa_sem_prazo: "justificativa sem prazo",
  role_id: "papel",
  cargo: "cargo",
  ativo: "ativo",
  meta: "meta",
  valor_inicial: "valor inicial",
  versao_publicada_id: "versão publicada",
  substituto_id: "substituto",
};

// campos tecnicos que nao interessam a quem le o historico
const IGNORADOS = new Set(["id", "criado_em", "atualizado_em", "criado_por", "google_doc_url"]);

const ROTULOS_STATUS: Record<string, string> = {
  pendente: "pendente",
  em_andamento: "em andamento",
  concluida: "concluída",
  bloqueada: "bloqueada",
  rascunho: "rascunho",
  revisao: "em revisão",
  publicado: "publicado",
  arquivado: "arquivado",
};

function valorLegivel(v: unknown) {
  if (v === null || v === undefined || v === "") return "vazio";
  if (typeof v === "boolean") return v ? "sim" : "não";
  if (typeof v === "string") {
    if (ROTULOS_STATUS[v]) return ROTULOS_STATUS[v];
    // ids nao dizem nada pra quem le; so registra que mudou
    if (/^[0-9a-f-]{36}$/i.test(v)) return null;
    return v.length > 40 ? `${v.slice(0, 40)}…` : v;
  }
  return String(v);
}

/** Frase curta descrevendo uma linha de audit_logs. */
export function descreverAlteracoes(acao: string, alteracoes: Record<string, unknown> | null) {
  if (acao === "insert") return "criou o registro";
  if (acao === "delete") return "excluiu o registro";
  if (!alteracoes) return "alterou o registro";

  const partes: string[] = [];
  for (const [campo, bruto] of Object.entries(alteracoes)) {
    if (IGNORADOS.has(campo)) continue;
    const rotulo = ROTULOS_CAMPO[campo] ?? campo.replace(/_/g, " ");
    const { para } = (bruto ?? {}) as { de?: unknown; para?: unknown };
    const legivel = valorLegivel(para);
    partes.push(legivel === null ? `alterou ${rotulo}` : `mudou ${rotulo} para "${legivel}"`);
  }
  return partes.length ? partes.join(", ") : "alterou o registro";
}
