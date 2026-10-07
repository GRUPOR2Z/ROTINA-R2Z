import { describe, expect, it } from "vitest";
import { ordenarAlertas } from "./alertas";

describe("ordenarAlertas", () => {
  it("nao lidos primeiro, depois severidade, depois mais novo", () => {
    const alertas = [
      { id: "lido-critico", severidade: "critico", criado_em: "2026-10-05", lido_em: "2026-10-06" },
      { id: "info-novo", severidade: "info", criado_em: "2026-10-06", lido_em: null },
      { id: "critico-velho", severidade: "critico", criado_em: "2026-10-01", lido_em: null },
      { id: "critico-novo", severidade: "critico", criado_em: "2026-10-04", lido_em: null },
    ];
    expect(ordenarAlertas(alertas).map((a) => a.id)).toEqual([
      "critico-novo",
      "critico-velho",
      "info-novo",
      "lido-critico",
    ]);
  });
});
