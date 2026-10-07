import { describe, expect, it } from "vitest";
import { formatarTamanho, validarArquivo, TAMANHO_MAXIMO_ANEXO } from "./documents";

describe("validarArquivo", () => {
  it("aceita documento comum", () => {
    expect(validarArquivo({ name: "contrato.pdf", size: 2048 })).toBeNull();
  });

  it("recusa arquivo acima do limite", () => {
    expect(validarArquivo({ name: "video.mp4", size: TAMANHO_MAXIMO_ANEXO + 1 })).toMatch(/10 MB/);
  });

  it("recusa executaveis e html", () => {
    expect(validarArquivo({ name: "setup.EXE", size: 10 })).not.toBeNull();
    expect(validarArquivo({ name: "pagina.html", size: 10 })).not.toBeNull();
  });
});

describe("formatarTamanho", () => {
  it("formata em B, KB e MB", () => {
    expect(formatarTamanho(500)).toBe("500 B");
    expect(formatarTamanho(2048)).toBe("2 KB");
    expect(formatarTamanho(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});
