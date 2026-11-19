/** Opções do calendário de conteúdo (calendar_events.rede / .formato).
 * Guardadas como texto no banco: dá para acrescentar opções aqui sem
 * migration. */

export const REDES = [
  { valor: "instagram", rotulo: "Instagram" },
  { valor: "tiktok", rotulo: "TikTok" },
  { valor: "youtube", rotulo: "YouTube" },
  { valor: "linkedin", rotulo: "LinkedIn" },
  { valor: "facebook", rotulo: "Facebook" },
  { valor: "outra", rotulo: "Outra" },
] as const;

export const FORMATOS = [
  { valor: "reels", rotulo: "Reels" },
  { valor: "carrossel", rotulo: "Carrossel" },
  { valor: "stories", rotulo: "Stories" },
  { valor: "post", rotulo: "Post estático" },
  { valor: "video", rotulo: "Vídeo" },
  { valor: "shorts", rotulo: "Shorts" },
  { valor: "live", rotulo: "Live" },
  { valor: "outro", rotulo: "Outro" },
] as const;

export function rotuloRede(valor: string | null | undefined) {
  if (!valor) return null;
  return REDES.find((r) => r.valor === valor)?.rotulo ?? valor;
}

export function rotuloFormato(valor: string | null | undefined) {
  if (!valor) return null;
  return FORMATOS.find((f) => f.valor === valor)?.rotulo ?? valor;
}

/** "Instagram · Reels" (ou só um dos dois, ou null). */
export function rotuloRedeFormato(rede: string | null | undefined, formato: string | null | undefined) {
  const partes = [rotuloRede(rede), rotuloFormato(formato)].filter(Boolean);
  return partes.length ? partes.join(" · ") : null;
}
