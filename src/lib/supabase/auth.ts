import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Quem esta logado, para telas (Server Components).
 *
 * Usa getClaims(): o projeto assina os tokens com chave assimetrica
 * (ES256), entao o JWT e' validado localmente com a chave publica, sem
 * ida ao servidor de Auth (~1 ms contra 60-600 ms do getUser). O
 * middleware ja renova a sessao a cada requisicao. cache() faz a
 * validacao rodar uma vez so por requisicao, mesmo com o menu, o
 * contador de alertas e a pagina pedindo o usuario.
 *
 * Server Actions (que gravam dados) continuam usando getUser(). */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
});
