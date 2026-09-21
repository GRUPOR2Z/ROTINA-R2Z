import { describe, expect, it } from "vitest";
import { gerarPdfProcesso } from "./process-pdf";

describe("gerarPdfProcesso", () => {
  it("gera um PDF válido com conteúdo simples", async () => {
    const bytes = await gerarPdfProcesso({
      titulo: "Processo de teste",
      objetivo: "Verificar que a geração funciona.",
      pre_requisitos: null,
      gatilho: null,
      entradas: null,
      passo_a_passo: "Passo 1\nPasso 2\nPasso 3",
      saidas: null,
      criterios_conclusao: null,
    });

    const cabecalho = Buffer.from(bytes.slice(0, 5)).toString("utf-8");
    expect(cabecalho).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(500);
  });

  it("não quebra com texto longo o suficiente para várias páginas", async () => {
    const textoLongo = Array.from({ length: 400 }, (_, i) => `linha número ${i} com algum conteúdo`).join(
      "\n",
    );

    const bytes = await gerarPdfProcesso({
      titulo: "Processo gigante",
      objetivo: null,
      pre_requisitos: null,
      gatilho: null,
      entradas: null,
      passo_a_passo: textoLongo,
      saidas: null,
      criterios_conclusao: null,
    });

    expect(Buffer.from(bytes.slice(0, 5)).toString("utf-8")).toBe("%PDF-");
  });

  it("lida com todos os campos vazios além do título", async () => {
    const bytes = await gerarPdfProcesso({
      titulo: "Só o título",
      objetivo: null,
      pre_requisitos: null,
      gatilho: null,
      entradas: null,
      passo_a_passo: null,
      saidas: null,
      criterios_conclusao: null,
    });

    expect(Buffer.from(bytes.slice(0, 5)).toString("utf-8")).toBe("%PDF-");
  });
});
