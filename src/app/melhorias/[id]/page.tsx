import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader, Section } from "@/components/layout/page-header";
import { ImprovementFields } from "@/components/melhorias/fields";
import { SelectField } from "@/components/forms/select-field";
import { Attachments } from "@/components/documents/attachments";
import { History } from "@/components/audit/history";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { getAreasEMembros, getVinculosTarefa } from "@/lib/lookups";
import { opcoesAreas, opcoesMembros } from "@/lib/opcoes";
import { STATUS_MELHORIA, TIPOS_MELHORIA, quadranteMelhoria, rotulo } from "@/lib/melhorias";
import { formatarData, nomeDe } from "@/lib/format";
import { atualizarMelhoria, excluirMelhoria, transformarMelhoriaEmTarefa, vincularMelhoriaAOkr } from "../actions";

export default async function MelhoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: m } = await supabase
    .from("improvement_items")
    .select("*, tasks(id, titulo, status), okrs(id, titulo)")
    .eq("id", id)
    .maybeSingle();
  if (!m) notFound();

  const [{ areas, membros }, vinculos] = await Promise.all([getAreasEMembros(), getVinculosTarefa()]);
  const autor = membros.find((x) => x.id === m.autor_id);
  const tarefa = m.tasks as { id: string; titulo: string; status: string } | null;
  const okr = m.okrs as { id: string; titulo: string } | null;
  const quadrante = quadranteMelhoria(m.impacto, m.esforco);
  const aprovadaOuDepois = ["aprovada", "em_implementacao", "implementada"].includes(m.status);

  return (
    <AppShell>
      <div className="flex max-w-3xl flex-col gap-8">
        <PageHeader
          title={m.titulo}
          back={{ href: "/melhorias", label: "Melhorias" }}
          actions={<Badge variant="secondary">{rotulo(STATUS_MELHORIA, m.status)}</Badge>}
          description={`${rotulo(TIPOS_MELHORIA, m.tipo)} · registrada por ${nomeDe(autor)} em ${formatarData(m.criado_em, { ano: true })}${
            quadrante ? ` · ${quadrante}` : ""
          }`}
        />

        <Section title="Encaminhamento">
          {!aprovadaOuDepois && (
            <p className="text-sm text-muted-foreground">
              Aprove a melhoria (status &quot;Aprovada&quot; abaixo) para transformá-la em tarefa ou iniciativa de OKR.
            </p>
          )}
          {aprovadaOuDepois && (
            <div className="flex flex-col gap-3 rounded-lg border p-4">
              {tarefa ? (
                <Link href={`/rotinas/${tarefa.id}`} className="text-sm text-primary hover:underline">
                  Tarefa: {tarefa.titulo} ({tarefa.status === "concluida" ? "concluída" : "em aberto"})
                </Link>
              ) : (
                <form action={transformarMelhoriaEmTarefa.bind(null, id)}>
                  <Button type="submit" size="sm" variant="outline">
                    Transformar em tarefa
                  </Button>
                </form>
              )}
              <form action={vincularMelhoriaAOkr.bind(null, id)} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <SelectField
                  name="okr_id"
                  label="Iniciativa de OKR"
                  options={vinculos.okrs}
                  defaultValue={m.okr_id}
                  emptyLabel="Nenhum"
                  placeholder="Nenhum"
                  className="flex flex-1 flex-col gap-2"
                />
                <Button type="submit" size="sm" variant="outline">
                  Vincular
                </Button>
              </form>
              {okr && (
                <Link href={`/okrs/${okr.id}`} className="text-sm text-primary hover:underline">
                  OKR: {okr.titulo}
                </Link>
              )}
            </div>
          )}
        </Section>

        <Section title="Detalhes">
          <form action={atualizarMelhoria.bind(null, id)} className="flex flex-col gap-4 rounded-lg border p-4">
            <ImprovementFields
              areas={opcoesAreas(areas)}
              membros={opcoesMembros(membros)}
              processos={vinculos.processos}
              melhoria={m}
              mostrarStatus
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="resultado">Resultado após implementação</Label>
              <Textarea
                id="resultado"
                name="resultado"
                defaultValue={m.resultado ?? ""}
                placeholder="O que mudou de fato? (preencha ao marcar como implementada)"
              />
            </div>
            <Button type="submit" size="sm" className="self-start">
              Salvar
            </Button>
          </form>
        </Section>

        <Section title="Anexos">
          <Attachments entidade="improvement" entidadeId={id} caminhoPagina={`/melhorias/${id}`} />
        </Section>

        <Section title="Histórico de alterações">
          <History tabela="improvement_items" registroId={id} />
        </Section>

        <form action={excluirMelhoria.bind(null, id)} className="border-t pt-4">
          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
            Excluir
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
