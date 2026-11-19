import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";

/** Roda a geracao (com trava de 5 min no banco) e devolve os alertas
 * visiveis pra pessoa, ja sem os tipos que ela silenciou. Falha na
 * geracao nao derruba a pagina: o sistema funciona mesmo se essa
 * parte estiver indisponivel (Doc. 1 §6). */
export async function getAlertasDoUsuario(opts: { incluirArquivados?: boolean; limite?: number } = {}) {
  const user = await getAuthUser();
  const supabase = await createClient();
  if (!user) return { alertas: [], silenciados: [] as string[], erroGeracao: false };

  const { error: erroGeracao } = await supabase.rpc("gerar_alertas");

  const { data: prefs } = await supabase
    .from("alert_preferences")
    .select("tipos_silenciados")
    .eq("profile_id", user.id)
    .maybeSingle();
  const silenciados: string[] = prefs?.tipos_silenciados ?? [];

  let query = supabase
    .from("alerts")
    .select("id, tipo, severidade, titulo, descricao, link, origem, task_id, destinatario_id, lido_em, arquivado_em, resolvido_em, criado_em")
    .or(`destinatario_id.eq.${user.id},destinatario_id.is.null`)
    .order("criado_em", { ascending: false })
    .limit(opts.limite ?? 200);

  if (!opts.incluirArquivados) query = query.is("arquivado_em", null).is("resolvido_em", null);
  if (silenciados.length > 0) query = query.not("tipo", "in", `(${silenciados.join(",")})`);

  const { data } = await query;
  return { alertas: data ?? [], silenciados, erroGeracao: Boolean(erroGeracao) };
}

/** Contador da barra lateral: so leitura, nao dispara a geracao. */
export async function contarAlertasNaoLidos() {
  const user = await getAuthUser();
  const supabase = await createClient();
  if (!user) return 0;

  const { count } = await supabase
    .from("alerts")
    .select("id", { count: "exact", head: true })
    .eq("destinatario_id", user.id)
    .is("lido_em", null)
    .is("arquivado_em", null)
    .is("resolvido_em", null);
  return count ?? 0;
}
