/** Leitura de FormData sem repetir `String(formData.get(x) ?? "").trim()`
 * em toda server action. */
export function texto(formData: FormData, chave: string) {
  return String(formData.get(chave) ?? "").trim();
}

export function textoOuNulo(formData: FormData, chave: string) {
  return texto(formData, chave) || null;
}

export function numeroOuNulo(formData: FormData, chave: string) {
  const bruto = texto(formData, chave).replace(",", ".");
  if (!bruto) return null;
  const n = Number(bruto);
  return Number.isFinite(n) ? n : null;
}

export function booleano(formData: FormData, chave: string) {
  const v = formData.get(chave);
  return v === "on" || v === "true" || v === "1";
}

/** Todos os valores de um campo repetido (ex: checkboxes de participantes). */
export function lista(formData: FormData, chave: string) {
  return formData
    .getAll(chave)
    .map((v) => String(v).trim())
    .filter(Boolean);
}
