import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type ConteudoProcesso = {
  titulo: string;
  objetivo: string | null;
  pre_requisitos: string | null;
  gatilho: string | null;
  entradas: string | null;
  passo_a_passo: string | null;
  saidas: string | null;
  criterios_conclusao: string | null;
};

const LARGURA = 595.28; // A4 em pontos
const ALTURA = 841.89;
const MARGEM = 50;
const LARGURA_TEXTO = LARGURA - MARGEM * 2;

function quebrarLinhas(texto: string, font: PDFFont, tamanho: number, larguraMax: number) {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let linhaAtual = "";

  for (const palavra of palavras) {
    const tentativa = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
    if (font.widthOfTextAtSize(tentativa, tamanho) > larguraMax && linhaAtual) {
      linhas.push(linhaAtual);
      linhaAtual = palavra;
    } else {
      linhaAtual = tentativa;
    }
  }
  if (linhaAtual) linhas.push(linhaAtual);
  return linhas;
}

export async function gerarPdfProcesso(processo: ConteudoProcesso) {
  const pdf = await PDFDocument.create();
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = pdf.addPage([LARGURA, ALTURA]);
  let y = ALTURA - MARGEM;

  function novaLinha(altura: number) {
    y -= altura;
    if (y < MARGEM) {
      page = pdf.addPage([LARGURA, ALTURA]);
      y = ALTURA - MARGEM;
    }
  }

  function desenharParagrafos(valor: string, font: PDFFont, tamanho: number, cor: ReturnType<typeof rgb>) {
    for (const paragrafo of valor.split("\n")) {
      if (paragrafo.trim() === "") {
        novaLinha(tamanho + 4);
        continue;
      }
      for (const linha of quebrarLinhas(paragrafo, font, tamanho, LARGURA_TEXTO)) {
        page.drawText(linha, { x: MARGEM, y, size: tamanho, font, color: cor });
        novaLinha(tamanho + 5);
      }
    }
  }

  desenharParagrafos(processo.titulo, fontBold, 18, rgb(0.1, 0.1, 0.1));
  novaLinha(10);

  const secoes: { label: string; valor: string | null }[] = [
    { label: "Objetivo", valor: processo.objetivo },
    { label: "Pré-requisitos", valor: processo.pre_requisitos },
    { label: "Gatilho", valor: processo.gatilho },
    { label: "Entradas", valor: processo.entradas },
    { label: "Passo a passo", valor: processo.passo_a_passo },
    { label: "Saídas", valor: processo.saidas },
    { label: "Critérios de conclusão", valor: processo.criterios_conclusao },
  ];

  for (const secao of secoes) {
    if (!secao.valor) continue;
    desenharParagrafos(secao.label, fontBold, 12, rgb(0.1, 0.1, 0.1));
    novaLinha(2);
    desenharParagrafos(secao.valor, fontRegular, 11, rgb(0.25, 0.25, 0.25));
    novaLinha(10);
  }

  return pdf.save();
}
