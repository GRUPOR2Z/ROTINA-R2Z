"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { gerarChaveDePropriedade } from "@/lib/client-properties";

/** Formato de entrada: uma opção por linha, "valor:rótulo". Se só um
 * pedaço for digitado, usa o mesmo texto pros dois lados. */
function lerOpcoes(formData: FormData) {
  const bruto = String(formData.get("opcoes") ?? "").trim();
  if (!bruto) return null;

  const opcoes = bruto
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean)
    .map((linha) => {
      const [valorBruto, rotuloBruto] = linha.split(":").map((parte) => parte.trim());
      return { valor: valorBruto || rotuloBruto, rotulo: rotuloBruto || valorBruto };
    });

  return opcoes.length > 0 ? { opcoes } : null;
}

export async function criarDefinicao(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const rotulo = String(formData.get("rotulo") ?? "").trim();
  if (!rotulo) return;

  const tipoCampo = String(formData.get("tipo_campo") ?? "texto");
  const tipoCliente = String(formData.get("tipo_cliente") ?? "").trim() || null;
  const obrigatorio = formData.get("obrigatorio") === "on";
  const padraoVisivelAoCliente = formData.get("padrao_visivel_ao_cliente") === "on";
  const opcoes = ["select", "multi_select"].includes(tipoCampo) ? lerOpcoes(formData) : null;

  // proxima posicao dentro do mesmo escopo (global ou do tipo_cliente),
  // pra reordenar (cima/baixo) ter o que trocar em vez de tudo empatado em 0.
  let escopo = supabase.from("client_property_definitions").select("ordem");
  escopo = tipoCliente ? escopo.eq("tipo_cliente", tipoCliente) : escopo.is("tipo_cliente", null);
  const { data: ultimo } = await escopo.order("ordem", { ascending: false }).limit(1).maybeSingle();

  await supabase.from("client_property_definitions").insert({
    chave: gerarChaveDePropriedade(rotulo),
    rotulo,
    tipo_campo: tipoCampo,
    tipo_cliente: tipoCliente,
    obrigatorio,
    padrao_visivel_ao_cliente: padraoVisivelAoCliente,
    opcoes,
    ordem: (ultimo?.ordem ?? -1) + 1,
    criado_por: user.id,
  });

  revalidatePath("/clientes/propriedades");
}

export async function arquivarDefinicao(definicaoId: string) {
  const supabase = await createClient();
  await supabase.from("client_property_definitions").update({ ativo: false }).eq("id", definicaoId);
  revalidatePath("/clientes/propriedades");
}

export async function reativarDefinicao(definicaoId: string) {
  const supabase = await createClient();
  await supabase.from("client_property_definitions").update({ ativo: true }).eq("id", definicaoId);
  revalidatePath("/clientes/propriedades");
}

/** Troca a `ordem` da definição com a vizinha imediata do mesmo escopo
 * -- reordenação simples de duas linhas, sem drag-and-drop. */
export async function moverDefinicao(definicaoId: string, direcao: "cima" | "baixo") {
  const supabase = await createClient();

  const { data: atual } = await supabase
    .from("client_property_definitions")
    .select("id, ordem, tipo_cliente")
    .eq("id", definicaoId)
    .maybeSingle();
  if (!atual) return;

  let vizinhoQuery = supabase
    .from("client_property_definitions")
    .select("id, ordem")
    .eq("ativo", true);
  vizinhoQuery = atual.tipo_cliente
    ? vizinhoQuery.eq("tipo_cliente", atual.tipo_cliente)
    : vizinhoQuery.is("tipo_cliente", null);
  vizinhoQuery =
    direcao === "cima" ? vizinhoQuery.lt("ordem", atual.ordem) : vizinhoQuery.gt("ordem", atual.ordem);

  const { data: vizinho } = await vizinhoQuery
    .order("ordem", { ascending: direcao === "baixo" })
    .limit(1)
    .maybeSingle();
  if (!vizinho) return;

  await supabase.from("client_property_definitions").update({ ordem: vizinho.ordem }).eq("id", atual.id);
  await supabase.from("client_property_definitions").update({ ordem: atual.ordem }).eq("id", vizinho.id);

  revalidatePath("/clientes/propriedades");
}
