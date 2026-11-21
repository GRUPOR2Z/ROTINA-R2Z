/** Permissões de cada login de cliente no portal (client_members.permissoes).
 * Mesmos nomes usados no banco pela função public.cliente_pode(). */

export const MODULOS = [
  { valor: "calendario", rotulo: "Calendário de conteúdo" },
  { valor: "tarefas", rotulo: "Tarefas" },
  { valor: "processos", rotulo: "Processos" },
  { valor: "roteiros", rotulo: "Roteiros" },
  { valor: "acessos", rotulo: "Acessos (contas)" },
] as const;

export const ACOES = [
  { valor: "ver", rotulo: "Ver" },
  { valor: "criar", rotulo: "Criar" },
  { valor: "editar", rotulo: "Editar" },
] as const;

export type Modulo = (typeof MODULOS)[number]["valor"];
export type Acao = (typeof ACOES)[number]["valor"];
export type Permissoes = Record<Modulo, Acao[]>;

/** O mesmo padrão da coluna no banco (o que o portal já mostrava). */
export const PERMISSOES_PADRAO: Permissoes = {
  calendario: ["ver"],
  tarefas: [],
  processos: ["ver"],
  roteiros: ["ver"],
  acessos: [],
};

/** Só leitura em tudo: o que a equipe vê na pré-visualização do portal. */
export const SO_LEITURA: Permissoes = {
  calendario: ["ver"],
  tarefas: ["ver"],
  processos: ["ver"],
  roteiros: ["ver"],
  acessos: ["ver"],
};

export function normalizarPermissoes(bruto: unknown): Permissoes {
  const obj = (bruto && typeof bruto === "object" ? bruto : {}) as Record<string, unknown>;
  const saida = {} as Permissoes;
  for (const { valor: modulo } of MODULOS) {
    const lista = Array.isArray(obj[modulo]) ? (obj[modulo] as unknown[]) : [];
    const acoes = ACOES.map((a) => a.valor).filter((a) => lista.includes(a));
    // criar ou editar sem ver não faz sentido: ver vem junto
    if ((acoes.includes("criar") || acoes.includes("editar")) && !acoes.includes("ver")) acoes.unshift("ver");
    saida[modulo] = acoes;
  }
  return saida;
}

export function pode(permissoes: Permissoes, modulo: Modulo, acao: Acao) {
  return permissoes[modulo]?.includes(acao) ?? false;
}
