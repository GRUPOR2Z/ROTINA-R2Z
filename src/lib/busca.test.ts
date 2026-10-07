import { describe, expect, it } from "vitest";
import { limparTermoBusca } from "./busca";

describe("limparTermoBusca", () => {
  it("remove caracteres que quebram o filtro do PostgREST", () => {
    expect(limparTermoBusca("proposta, (comercial)")).toBe("proposta comercial");
    expect(limparTermoBusca("100%*")).toBe("100");
  });

  it("exige pelo menos 2 caracteres", () => {
    expect(limparTermoBusca("a")).toBeNull();
    expect(limparTermoBusca("   ")).toBeNull();
    expect(limparTermoBusca(undefined)).toBeNull();
  });

  it("limita o tamanho", () => {
    expect(limparTermoBusca("x".repeat(200))?.length).toBe(80);
  });
});
