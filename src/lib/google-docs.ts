import { google } from "googleapis";

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !key) {
    throw new Error("Credenciais do Google não configuradas em .env.local");
  }

  return new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, "\n"),
    scopes: [
      "https://www.googleapis.com/auth/documents",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

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

function montarConteudo(processo: ConteudoProcesso) {
  const secoes: { label: string; valor: string | null }[] = [
    { label: "Objetivo", valor: processo.objetivo },
    { label: "Pré-requisitos", valor: processo.pre_requisitos },
    { label: "Gatilho", valor: processo.gatilho },
    { label: "Entradas", valor: processo.entradas },
    { label: "Passo a passo", valor: processo.passo_a_passo },
    { label: "Saídas", valor: processo.saidas },
    { label: "Critérios de conclusão", valor: processo.criterios_conclusao },
  ];

  let texto = `${processo.titulo}\n`;
  const heading1Range = { startIndex: 1, endIndex: 1 + processo.titulo.length };
  const heading2Ranges: { startIndex: number; endIndex: number }[] = [];

  for (const secao of secoes) {
    if (!secao.valor) continue;
    const inicioLabel = 1 + texto.length;
    texto += `${secao.label}\n`;
    heading2Ranges.push({ startIndex: inicioLabel, endIndex: inicioLabel + secao.label.length });
    texto += `${secao.valor}\n\n`;
  }

  return { texto, heading1Range, heading2Ranges };
}

function extrairDocumentId(url: string | null) {
  if (!url) return null;
  return url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] ?? null;
}

export async function exportarProcessoParaGoogleDocs(
  processo: ConteudoProcesso,
  docExistenteUrl: string | null,
) {
  const auth = getAuth();
  const docs = google.docs({ version: "v1", auth });
  const drive = google.drive({ version: "v3", auth });

  let documentId = extrairDocumentId(docExistenteUrl);

  if (!documentId) {
    const criado = await docs.documents.create({ requestBody: { title: processo.titulo } });
    documentId = criado.data.documentId ?? null;
    if (!documentId) throw new Error("Google Docs não retornou o id do documento criado.");

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (folderId) {
      await drive.files.update({
        fileId: documentId,
        addParents: folderId,
        removeParents: "root",
        fields: "id, parents",
      });
    }
  } else {
    const atual = await docs.documents.get({ documentId });
    const tamanhoAtual =
      atual.data.body?.content?.reduce((acc, el) => (el.endIndex ? Math.max(acc, el.endIndex) : acc), 1) ?? 1;

    if (tamanhoAtual > 2) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [{ deleteContentRange: { range: { startIndex: 1, endIndex: tamanhoAtual - 1 } } }],
        },
      });
    }
  }

  const { texto, heading1Range, heading2Ranges } = montarConteudo(processo);

  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        { insertText: { location: { index: 1 }, text: texto } },
        {
          updateParagraphStyle: {
            range: heading1Range,
            paragraphStyle: { namedStyleType: "HEADING_1" },
            fields: "namedStyleType",
          },
        },
        ...heading2Ranges.map((range) => ({
          updateParagraphStyle: {
            range,
            paragraphStyle: { namedStyleType: "HEADING_2" },
            fields: "namedStyleType",
          },
        })),
      ],
    },
  });

  return `https://docs.google.com/document/d/${documentId}/edit`;
}
