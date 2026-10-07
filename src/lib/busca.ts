/** Termo seguro pra usar dentro de um filtro `.or(...ilike...)` do
 * PostgREST: tira os caracteres que tem significado na sintaxe do
 * filtro (virgula, parenteses) e curingas, e exige 2+ caracteres. */
export function limparTermoBusca(q: string | undefined | null) {
  const limpo = (q ?? "").replace(/[,()%*\\:"]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  return limpo.length >= 2 ? limpo : null;
}
