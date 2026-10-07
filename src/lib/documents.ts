export type EntidadeDocumento =
  | "task"
  | "project"
  | "process"
  | "meeting"
  | "decision"
  | "improvement"
  | "onboarding_step"
  | "client";

export const TAMANHO_MAXIMO_ANEXO = 10 * 1024 * 1024;

// executaveis/scripts ficam de fora -- anexo e' documento/imagem/planilha
const EXTENSOES_BLOQUEADAS = /\.(exe|bat|cmd|com|msi|sh|ps1|js|mjs|vbs|scr|jar|dll|html?|svg)$/i;

/** Retorna a mensagem de erro, ou null se o arquivo pode subir. */
export function validarArquivo(arquivo: { name: string; size: number }) {
  if (arquivo.size > TAMANHO_MAXIMO_ANEXO) return "Arquivo maior que 10 MB.";
  if (EXTENSOES_BLOQUEADAS.test(arquivo.name)) return "Tipo de arquivo não permitido.";
  return null;
}

export function formatarTamanho(bytes: number | null) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
