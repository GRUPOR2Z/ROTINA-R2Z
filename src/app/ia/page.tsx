import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { resumoValidacao } from "@/lib/ia";
import { formatarData, formatarDataHora } from "@/lib/format";

export default async function IAPage() {
  const supabase = await createClient();
  const eu = await getCurrentProfile();

  const restrito = !eu?.isGestorOuAdmin;
  const { data: relatorios } = await supabase
    .from("ai_reports")
    .select("id, titulo, periodo_inicio, periodo_fim, resumo, dados_insuficientes, gerado_em, ai_findings(tipo, prioridade, validacao)")
    .order("gerado_em", { ascending: false })
    .limit(50);

  return (
    <AppShell>
      <div className="flex max-w-4xl flex-col gap-6">
        <PageHeader
          title="Grupo R2Z IA"
          description="Relatórios gerados por IA a partir dos dados do sistema. Fatos, hipóteses e recomendações separados — toda decisão é humana."
        />

        {restrito || (relatorios ?? []).length === 0 ? (
          <EmptyState
            title={restrito ? "Acesso restrito" : "Nenhum relatório ainda"}
            description={
              restrito
                ? "Relatórios da IA são visíveis para gestores e administradores."
                : "Os relatórios vão chegar automaticamente quando a integração com o n8n for ligada. A estrutura (validação, comentários, vínculos e alertas) já está pronta."
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {relatorios!.map((r) => {
              const resumo = resumoValidacao(r.ai_findings ?? []);
              return (
                <li key={r.id}>
                  <Link href={`/ia/${r.id}`} className="flex flex-col gap-2 rounded-lg border p-4 hover:bg-muted/40">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{r.titulo}</span>
                      {r.dados_insuficientes && <Badge variant="outline">Dados insuficientes</Badge>}
                      {resumo.pendentes > 0 && <Badge>{resumo.pendentes} para validar</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Período {formatarData(r.periodo_inicio)} – {formatarData(r.periodo_fim, { ano: true })} · gerado em{" "}
                      {formatarDataHora(r.gerado_em)} · {(r.ai_findings ?? []).length} achados
                    </span>
                    {r.resumo && <p className="line-clamp-2 text-sm text-muted-foreground">{r.resumo}</p>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
