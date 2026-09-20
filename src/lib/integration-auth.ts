export function verificaSegredoN8n(request: Request): boolean {
  const esperado = process.env.N8N_WEBHOOK_SECRET;
  if (!esperado) return false;

  const auth = request.headers.get("authorization") ?? "";
  const recebido = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  return recebido === esperado;
}
