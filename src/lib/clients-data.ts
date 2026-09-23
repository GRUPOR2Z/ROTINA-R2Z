import { createClient } from "@/lib/supabase/server";
import {
  formatarValorPropriedade,
  ordenarDefinicoes,
  type DefinicaoPropriedade,
} from "@/lib/client-properties";

type LinhaDefinicao = DefinicaoPropriedade & { tipo_cliente: string | null; ordem: number; ativo: boolean };

/** Definicoes de propriedade que valem pra um `tipo_cliente`: as
 * globais (tipo_cliente nulo) mais as especificas daquele tipo. A
 * tabela e' pequena e mantida por admin, entao filtra em memoria em
 * vez de montar `.or()` dinamico (evita ter que escapar o texto livre
 * de tipo_cliente numa query string). */
export async function getDefinicoesDoTipo(tipoCliente: string | null) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_property_definitions")
    .select("id, chave, rotulo, tipo_campo, opcoes, obrigatorio, padrao_visivel_ao_cliente, ordem, ativo, tipo_cliente")
    .eq("ativo", true)
    .returns<LinhaDefinicao[]>();

  const aplicaveis = (data ?? []).filter((d) => d.tipo_cliente === null || d.tipo_cliente === tipoCliente);
  return ordenarDefinicoes(aplicaveis);
}

/** Cliente + as definicoes aplicaveis ao seu tipo + o valor atual de
 * cada uma (quando existir). Usado na pagina de detalhe do cliente. */
export async function getClienteComPropriedades(clientId: string) {
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clients")
    .select("id, nome, tipo_cliente, avatar_url, capa_url, arquivado, criado_em")
    .eq("id", clientId)
    .maybeSingle();

  if (!cliente) return null;

  const [definicoes, { data: valores }] = await Promise.all([
    getDefinicoesDoTipo(cliente.tipo_cliente),
    supabase
      .from("client_property_values")
      .select("property_definition_id, valor")
      .eq("client_id", clientId),
  ]);

  const valorPorDefinicao = new Map<string, unknown>(
    (valores ?? []).map((v) => [v.property_definition_id, v.valor]),
  );

  return { cliente, definicoes, valorPorDefinicao };
}

/** Lista enxuta pra selects (vincular tarefa a cliente, filtro de
 * rotinas, etc.) -- não carrega propriedade nenhuma. */
export async function getClientesAtivos() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id, nome")
    .eq("arquivado", false)
    .order("nome");

  return data ?? [];
}

/** Badges pra galeria: valores das propriedades tipo "seleção única"
 * de cada cliente, já formatados pelo rótulo da opção (ex: "Ativo",
 * "Em andamento") -- é o mesmo efeito visual do "Status" do Notion,
 * sem precisar de uma propriedade fixa nova pra isso. */
export async function getBadgesPorCliente() {
  const supabase = await createClient();

  const { data: definicoes } = await supabase
    .from("client_property_definitions")
    .select("id, chave, rotulo, tipo_campo, opcoes, obrigatorio")
    .eq("tipo_campo", "select")
    .eq("ativo", true)
    .returns<DefinicaoPropriedade[]>();

  const badgesPorCliente = new Map<string, string[]>();
  if (!definicoes || definicoes.length === 0) return badgesPorCliente;

  const { data: valores } = await supabase
    .from("client_property_values")
    .select("client_id, property_definition_id, valor")
    .in(
      "property_definition_id",
      definicoes.map((d) => d.id),
    );

  const definicaoPorId = new Map(definicoes.map((d) => [d.id, d]));

  for (const valor of valores ?? []) {
    const definicao = definicaoPorId.get(valor.property_definition_id);
    if (!definicao) continue;

    const lista = badgesPorCliente.get(valor.client_id) ?? [];
    lista.push(formatarValorPropriedade(definicao, valor.valor));
    badgesPorCliente.set(valor.client_id, lista);
  }

  return badgesPorCliente;
}

type ProcessoVinculado = {
  id: string;
  processes: {
    id: string;
    titulo: string;
    status: string;
    areas: { nome: string } | null;
    profiles: { nome: string | null; email: string | null } | null;
  } | null;
};

/** Processos vinculados a este cliente -- lê pela tabela de relação,
 * então nunca mostra processo exclusivo de outro cliente. */
export async function getProcessosDoCliente(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("process_clients")
    .select(
      "id, processes(id, titulo, status, areas(nome), profiles!processes_responsavel_id_fkey(nome, email))",
    )
    .eq("client_id", clientId)
    .order("vinculado_em", { ascending: false })
    .returns<ProcessoVinculado[]>();

  return data ?? [];
}

/** Processos ainda não vinculados a este cliente (e não arquivados) --
 * alimenta o select de "vincular processo existente". */
export async function getProcessosParaVincular(clientId: string) {
  const supabase = await createClient();

  const [{ data: todos }, { data: vinculados }] = await Promise.all([
    supabase.from("processes").select("id, titulo").neq("status", "arquivado").order("titulo"),
    supabase.from("process_clients").select("process_id").eq("client_id", clientId),
  ]);

  const idsVinculados = new Set((vinculados ?? []).map((v) => v.process_id));
  return (todos ?? []).filter((p) => !idsVinculados.has(p.id));
}
