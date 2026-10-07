import { describe, expect, it } from "vitest";
import { calcularCarga, dependenciasDeUmaPessoa, mediaAbertas, sobrecarregado } from "./equipe";

const hoje = new Date(2026, 9, 7, 12);

describe("calcularCarga", () => {
  it("conta abertas, atrasadas, bloqueadas e concluidas nos ultimos 30 dias", () => {
    const carga = calcularCarga(
      [
        { responsavel_id: "a", status: "pendente", prazo: "2026-10-01", concluida_em: null },
        { responsavel_id: "a", status: "bloqueada", prazo: "2026-12-01", concluida_em: null },
        { responsavel_id: "a", status: "concluida", prazo: null, concluida_em: "2026-10-05T10:00:00Z" },
        { responsavel_id: "a", status: "concluida", prazo: null, concluida_em: "2026-01-05T10:00:00Z" },
        { responsavel_id: null, status: "pendente", prazo: null, concluida_em: null },
      ],
      hoje,
    );
    expect(carga.get("a")).toEqual({ abertas: 2, atrasadas: 1, bloqueadas: 1, concluidas30d: 1 });
    expect(carga.size).toBe(1);
  });
});

describe("sobrecarregado", () => {
  it("destaca quem esta bem acima da media", () => {
    const cargas = new Map([
      ["a", { abertas: 12, atrasadas: 0, bloqueadas: 0, concluidas30d: 0 }],
      ["b", { abertas: 2, atrasadas: 0, bloqueadas: 0, concluidas30d: 0 }],
      ["c", { abertas: 3, atrasadas: 0, bloqueadas: 0, concluidas30d: 0 }],
    ]);
    const media = mediaAbertas(cargas);
    expect(sobrecarregado(cargas.get("a"), media)).toBe(true);
    expect(sobrecarregado(cargas.get("b"), media)).toBe(false);
  });
});

describe("dependenciasDeUmaPessoa", () => {
  it("lista processos ativos sem substituto por responsavel", () => {
    const deps = dependenciasDeUmaPessoa([
      { id: "1", titulo: "A", status: "publicado", critico: true, responsavel_id: "a", substituto_id: null },
      { id: "2", titulo: "B", status: "publicado", critico: false, responsavel_id: "a", substituto_id: "b" },
      { id: "3", titulo: "C", status: "arquivado", critico: true, responsavel_id: "a", substituto_id: null },
    ]);
    expect(deps.get("a")?.semSubstituto.map((p) => p.id)).toEqual(["1"]);
    expect(deps.get("a")?.criticos).toBe(1);
  });
});
