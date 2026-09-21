import mammoth from "mammoth";

export async function extrairTextoDeArquivo(buffer: Buffer, nomeArquivo: string): Promise<string> {
  const extensao = nomeArquivo.split(".").pop()?.toLowerCase();

  if (extensao === "docx") {
    const resultado = await mammoth.extractRawText({ buffer });
    return resultado.value.trim();
  }

  if (extensao === "pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const resultado = await parser.getText();
      return resultado.text.trim();
    } finally {
      await parser.destroy();
    }
  }

  throw new Error("Formato não suportado — envie um arquivo .docx ou .pdf.");
}
