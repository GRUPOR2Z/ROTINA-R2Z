import { describe, expect, it } from "vitest";
import {
  formatarValorPropriedade,
  gerarChaveDePropriedade,
  normalizarValorFormulario,
  ordenarDefinicoes,
  type DefinicaoPropriedade,
} from "./client-properties";

function definicao(overrides: Partial<DefinicaoPropriedade> = {}): DefinicaoPropriedade {
  return {
    id: "def-1",
    chave: "campo",
    rotulo: "Campo",
    tipo_campo: "texto",
    opcoes: null,
    obrigatorio: false,
    ...overrides,
  };
}

describe("gerarChaveDePropriedade", () => {
  it("remove acentos, espaços e caixa alta", () => {
    expect(gerarChaveDePropriedade("Saúde do Cliente")).toBe("saude_do_cliente");
  });

  it("remove underscores nas pontas", () => {
    expect(gerarChaveDePropriedade("  MRR  ")).toBe("mrr");
  });
});

describe("normalizarValorFormulario", () => {
  it("converte campo vazio em null", () => {
    expect(normalizarValorFormulario("texto", "")).toBeNull();
    expect(normalizarValorFormulario("texto", "   ")).toBeNull();
  });

  it("converte numero e moeda usando vírgula como separador decimal", () => {
    expect(normalizarValorFormulario("numero", "42")).toBe(42);
    expect(normalizarValorFormulario("moeda", "15000,50")).toBe(15000.5);
  });

  it("descarta numero inválido", () => {
    expect(normalizarValorFormulario("numero", "abc")).toBeNull();
  });

  it("converte booleano a partir de checkbox ('on') ou 'true'", () => {
    expect(normalizarValorFormulario("booleano", "on")).toBe(true);
    expect(normalizarValorFormulario("booleano", "true")).toBe(true);
    expect(normalizarValorFormulario("booleano", null)).toBe(false);
  });

  it("junta multi_select em lista, ignorando vazios", () => {
    expect(normalizarValorFormulario("multi_select", ["a", "", "b"])).toEqual(["a", "b"]);
    expect(normalizarValorFormulario("multi_select", [])).toBeNull();
    expect(normalizarValorFormulario("multi_select", null)).toBeNull();
  });

  it("mantém texto simples para select/url", () => {
    expect(normalizarValorFormulario("select", "ativo")).toBe("ativo");
    expect(normalizarValorFormulario("url", "https://r2z.com.br")).toBe("https://r2z.com.br");
  });
});

describe("formatarValorPropriedade", () => {
  it("mostra travessão quando não há valor", () => {
    expect(formatarValorPropriedade(definicao(), null)).toBe("—");
  });

  it("formata moeda em BRL", () => {
    expect(formatarValorPropriedade(definicao({ tipo_campo: "moeda" }), 15000)).toContain("15.000,00");
  });

  it("formata booleano como Sim/Não", () => {
    expect(formatarValorPropriedade(definicao({ tipo_campo: "booleano" }), true)).toBe("Sim");
    expect(formatarValorPropriedade(definicao({ tipo_campo: "booleano" }), false)).toBe("Não");
  });

  it("traduz select pelo rótulo da opção", () => {
    const def = definicao({
      tipo_campo: "select",
      opcoes: { opcoes: [{ valor: "ativo", rotulo: "Ativo" }] },
    });
    expect(formatarValorPropriedade(def, "ativo")).toBe("Ativo");
  });

  it("traduz multi_select juntando os rótulos", () => {
    const def = definicao({
      tipo_campo: "multi_select",
      opcoes: {
        opcoes: [
          { valor: "whatsapp", rotulo: "IA WhatsApp" },
          { valor: "trafego", rotulo: "Tráfego Pago" },
        ],
      },
    });
    expect(formatarValorPropriedade(def, ["whatsapp", "trafego"])).toBe("IA WhatsApp, Tráfego Pago");
  });
});

describe("ordenarDefinicoes", () => {
  it("ordena por `ordem` e desempata por rótulo", () => {
    const definicoes = [
      { ordem: 1, rotulo: "MRR" },
      { ordem: 0, rotulo: "Situação" },
      { ordem: 0, rotulo: "Data de Início" },
    ];

    expect(ordenarDefinicoes(definicoes).map((d) => d.rotulo)).toEqual([
      "Data de Início",
      "Situação",
      "MRR",
    ]);
  });
});
