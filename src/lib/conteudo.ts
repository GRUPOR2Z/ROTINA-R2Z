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

/** Andamento de cada post. A equipe muda qualquer um; o cliente so
 * responde os que estao "em_aprovacao" (aprova ou pede ajuste). */
export const STATUS_POST = [
  { valor: "planejado", rotulo: "Planejado", chip: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  { valor: "em_producao", rotulo: "Em produção", chip: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
  { valor: "em_aprovacao", rotulo: "Aguardando aprovação", chip: "bg-amber-100 text-amber-900", dot: "bg-amber-500" },
  { valor: "ajustes", rotulo: "Ajustes pedidos", chip: "bg-red-100 text-red-800", dot: "bg-red-500" },
  { valor: "aprovado", rotulo: "Aprovado", chip: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  { valor: "publicado", rotulo: "Publicado", chip: "bg-brand-900 text-white", dot: "bg-brand-900" },
] as const;

export type StatusPost = (typeof STATUS_POST)[number]["valor"];

export function infoStatus(valor: string | null | undefined) {
  return STATUS_POST.find((s) => s.valor === valor) ?? STATUS_POST[0];
}

/** Cor de cada post no calendário = formato (Reels azul, Carrossel rosa,
 * Stories marrom...). O status aparece como etiqueta, não como cor. */
const CORES_FORMATO: Record<string, { chip: string; dot: string; rotulo: string }> = {
  reels: { rotulo: "Reels", chip: "bg-blue-100 text-blue-900", dot: "bg-blue-500" },
  carrossel: { rotulo: "Carrossel", chip: "bg-pink-100 text-pink-900", dot: "bg-pink-500" },
  stories: { rotulo: "Stories", chip: "bg-[#efe3d8] text-[#5b3a24]", dot: "bg-[#8b5a3c]" },
  video: { rotulo: "Vídeo", chip: "bg-violet-100 text-violet-900", dot: "bg-violet-500" },
  post: { rotulo: "Post estático", chip: "bg-emerald-100 text-emerald-900", dot: "bg-emerald-500" },
  shorts: { rotulo: "Shorts", chip: "bg-red-100 text-red-900", dot: "bg-red-500" },
  live: { rotulo: "Live", chip: "bg-orange-100 text-orange-900", dot: "bg-orange-500" },
};
const COR_SEM_FORMATO = { rotulo: "Outro / sem formato", chip: "bg-slate-100 text-slate-700", dot: "bg-slate-400" };

export function corDoFormato(formato: string | null | undefined) {
  return (formato && CORES_FORMATO[formato]) || COR_SEM_FORMATO;
}

/** Legenda do calendário, na ordem das opções de formato. */
export const LEGENDA_FORMATOS = [
  ...FORMATOS.filter((f) => CORES_FORMATO[f.valor]).map((f) => ({ valor: f.valor, ...CORES_FORMATO[f.valor] })),
  { valor: "outro", ...COR_SEM_FORMATO },
];

/** Status que merecem destaque na grade (bolinha no post). */
export function alertaStatus(status: string | null | undefined) {
  if (status === "em_aprovacao") return { dot: "bg-amber-500", rotulo: "Aguardando aprovação" };
  if (status === "ajustes") return { dot: "bg-red-500", rotulo: "Ajustes pedidos" };
  return null;
}
