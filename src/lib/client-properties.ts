// Helpers puros do schema generico de propriedades do cliente
// (client_property_definitions + client_property_values). Mantidos
// sem dependencia do Supabase pra dar pra testar isolado.

export type TipoCampoPropriedade =
  | "texto"
  | "numero"
  | "moeda"
  | "data"
  | "booleano"
  | "select"
  | "multi_select"
  | "usuario"
  | "url";

export type OpcaoPropriedade = { valor: string; rotulo: string };

export type DefinicaoPropriedade = {
  id: string;
  chave: string;
  rotulo: string;
  tipo_campo: TipoCampoPropriedade;
  opcoes: { opcoes: OpcaoPropriedade[] } | null;
  obrigatorio: boolean;
};

export function opcoesDaPropriedade(definicao: Pick<DefinicaoPropriedade, "opcoes">): OpcaoPropriedade[] {
  return definicao.opcoes?.opcoes ?? [];
}

/** Slug estavel gerado a partir do rotulo digitado (ex: "Saúde do
 * Cliente" -> "saude_do_cliente"). Usado como `chave`, entao precisa
 * ser deterministico e sem acento/espaco. */
export function gerarChaveDePropriedade(rotulo: string): string {
  return rotulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Converte a entrada bruta de um campo de formulario (string, ou
 * lista de strings no caso de multi_select) no valor JSON que vai pra
 * client_property_values. Vazio vira `null` -- convenciona "sem
 * valor" em vez de string vazia espalhada pelo banco. */
export function normalizarValorFormulario(
  tipoCampo: TipoCampoPropriedade,
  bruto: string | string[] | null | undefined,
): unknown {
  if (tipoCampo === "multi_select") {
    const lista = (Array.isArray(bruto) ? bruto : bruto ? [bruto] : []).filter(Boolean);
    return lista.length > 0 ? lista : null;
  }

  // booleano nunca "esvazia": um checkbox desmarcado não manda nada no
  // FormData (bruto = null), o que precisa virar `false` explícito --
  // não `null` (que a action interpreta como "apagar o valor").
  if (tipoCampo === "booleano") {
    const texto = Array.isArray(bruto) ? bruto[0] : bruto;
    return texto === "true" || texto === "on";
  }

  const texto = (Array.isArray(bruto) ? bruto[0] : bruto)?.trim() ?? "";
  if (!texto) return null;

  switch (tipoCampo) {
    case "numero":
    case "moeda": {
      const numero = Number(texto.replace(",", "."));
      return Number.isFinite(numero) ? numero : null;
    }
    default:
      return texto;
  }
}

/** Formata um valor ja salvo pra exibicao somente-leitura no painel de
 * propriedades. */
export function formatarValorPropriedade(definicao: DefinicaoPropriedade, valor: unknown): string {
  if (valor === null || valor === undefined) return "—";

  switch (definicao.tipo_campo) {
    case "moeda":
      return typeof valor === "number"
        ? valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        : String(valor);
    case "numero":
      return typeof valor === "number" ? valor.toLocaleString("pt-BR") : String(valor);
    case "data":
      return typeof valor === "string"
        ? new Date(`${valor}T00:00:00`).toLocaleDateString("pt-BR")
        : String(valor);
    case "booleano":
      return valor ? "Sim" : "Não";
    case "multi_select": {
      const lista = Array.isArray(valor) ? valor : [];
      const opcoes = opcoesDaPropriedade(definicao);
      const rotulos = lista.map((v) => opcoes.find((o) => o.valor === v)?.rotulo ?? String(v));
      return rotulos.length > 0 ? rotulos.join(", ") : "—";
    }
    case "select": {
      const opcoes = opcoesDaPropriedade(definicao);
      return opcoes.find((o) => o.valor === valor)?.rotulo ?? String(valor);
    }
    default:
      return String(valor);
  }
}

/** Ordena definicoes por `ordem` e, em empate, por rotulo -- garante
 * uma ordem estavel mesmo antes de qualquer reordenacao manual. */
export function ordenarDefinicoes<T extends { ordem: number; rotulo: string }>(definicoes: T[]): T[] {
  return [...definicoes].sort((a, b) => a.ordem - b.ordem || a.rotulo.localeCompare(b.rotulo, "pt-BR"));
}
