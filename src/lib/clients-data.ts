import { createClient } from "@/lib/supabase/server";
import { ordenarDefinicoes, type DefinicaoPropriedade } from "@/lib/client-properties";

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
