import { describe, expect, it } from "vitest";
import { intervaloDoPeriodo } from "./periodo";

const hoje = new Date(2026, 9, 7); // qua, 07/10/2026

describe("intervaloDoPeriodo", () => {
  it("semana vai de domingo a sabado", () => {
    expect(intervaloDoPeriodo("semana", hoje)).toEqual({ inicio: "2026-10-04", fim: "2026-10-10" });
  });

  it("mes cobre o mes inteiro", () => {
    expect(intervaloDoPeriodo("mes", hoje)).toEqual({ inicio: "2026-10-01", fim: "2026-10-31" });
  });

  it("ultimos e proximos 30 dias", () => {
    expect(intervaloDoPeriodo("30d", hoje)).toEqual({ inicio: "2026-09-07", fim: "2026-10-07" });
    expect(intervaloDoPeriodo("proximos30", hoje)).toEqual({ inicio: "2026-10-07", fim: "2026-11-06" });
  });

  it("sem periodo = tudo", () => {
    expect(intervaloDoPeriodo(undefined, hoje)).toBeNull();
    expect(intervaloDoPeriodo("qualquer", hoje)).toBeNull();
  });
});
