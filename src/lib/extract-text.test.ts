import { describe, expect, it } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { extrairTextoDeArquivo } from "./extract-text";

async function gerarPdfDeTeste(texto: string) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const page = pdf.addPage([400, 200]);
  page.drawText(texto, { x: 50, y: 150, size: 14, font });
  return Buffer.from(await pdf.save());
}

describe("extrairTextoDeArquivo", () => {
  it("extrai o texto de um PDF real", async () => {
    const buffer = await gerarPdfDeTeste("Ola Grupo R2Z");
    const texto = await extrairTextoDeArquivo(buffer, "documento.pdf");
    expect(texto).toContain("Ola Grupo R2Z");
  });

  it("rejeita formatos não suportados", async () => {
    await expect(extrairTextoDeArquivo(Buffer.from("abc"), "planilha.xlsx")).rejects.toThrow(
      /não suportado/,
    );
  });
});
