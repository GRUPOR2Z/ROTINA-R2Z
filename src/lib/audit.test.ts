import { describe, expect, it } from "vitest";
import { descreverAlteracoes } from "./audit";

describe("descreverAlteracoes", () => {
  it("descreve criacao e exclusao", () => {
    expect(descreverAlteracoes("insert", null)).toBe("criou o registro");
    expect(descreverAlteracoes("delete", null)).toBe("excluiu o registro");
  });

  it("traduz status e campos conhecidos", () => {
    expect(descreverAlteracoes("update", { status: { de: "pendente", para: "concluida" } })).toBe(
      'mudou status para "concluída"',
    );
  });

  it("nao mostra uuid cru, so que mudou", () => {
    expect(
      descreverAlteracoes("update", {
        responsavel_id: { de: null, para: "0b6f3c1e-1111-4222-8333-444455556666" },
      }),
    ).toBe("alterou responsável");
  });

  it("ignora campos tecnicos", () => {
    expect(descreverAlteracoes("update", { atualizado_em: { de: "a", para: "b" } })).toBe("alterou o registro");
  });
});
