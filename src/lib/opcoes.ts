export type Opcao = { value: string; label: string };

export function opcoesMembros(membros: { id: string; nome: string | null; email: string | null }[]): Opcao[] {
  return membros.map((m) => ({ value: m.id, label: m.nome || m.email || "—" }));
}

export function opcoesAreas(areas: { id: string; nome: string }[]): Opcao[] {
  return areas.map((a) => ({ value: a.id, label: a.nome }));
}
