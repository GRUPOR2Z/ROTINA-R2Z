/** "2026-10-06" -> "06 de out." (meia-noite local, sem deslocar o dia pelo fuso). */
export function formatarData(iso: string | null | undefined, opts?: { ano?: boolean }) {
  if (!iso) return "—";
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    ...(opts?.ano ? { year: "numeric" } : {}),
  });
}

export function formatarDataHora(iso: string | Date | null | undefined) {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function nomeDe(p: { nome: string | null; email: string | null } | null | undefined) {
  return p?.nome || p?.email || "—";
}

/** Supabase devolve relacoes 1:1 tipadas como array/objeto generico;
 * isso so centraliza o cast que as paginas ja faziam inline. */
export function rel<T>(valor: unknown) {
  return valor as T | null;
}
