import { createClient } from "@/lib/supabase/server";
import { formatarDataHora, nomeDe, rel } from "@/lib/format";
import { descreverAlteracoes } from "@/lib/audit";

/** Linha do tempo de alteracoes de um registro (alimentada pelo
 * trigger registrar_auditoria). */
export async function History({ tabela, registroId, limite = 30 }: { tabela: string; registroId: string; limite?: number }) {
  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, acao, alteracoes, criado_em, profiles(nome, email)")
    .eq("tabela", tabela)
    .eq("registro_id", registroId)
    .order("criado_em", { ascending: false })
    .limit(limite);

  if (!logs || logs.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma alteração registrada ainda.</p>;
  }

  return (
    <ol className="flex flex-col gap-2 border-l pl-4">
      {logs.map((l) => (
        <li key={l.id} className="text-sm">
          <span className="font-medium">{nomeDe(rel(l.profiles))}</span>{" "}
          <span className="text-muted-foreground">
            {descreverAlteracoes(l.acao, l.alteracoes as Record<string, unknown> | null)}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">{formatarDataHora(l.criado_em)}</span>
        </li>
      ))}
    </ol>
  );
}
