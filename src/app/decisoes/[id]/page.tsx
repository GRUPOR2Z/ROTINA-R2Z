import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader, Section } from "@/components/layout/page-header";
import { DecisionFields } from "@/components/decisoes/fields";
import { Attachments } from "@/components/documents/attachments";
import { History } from "@/components/audit/history";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getAreasEMembros, getReunioesRecentes, getVinculosTarefa } from "@/lib/lookups";
import { opcoesAreas } from "@/lib/opcoes";
import { formatarData, nomeDe } from "@/lib/format";
import { alternarRevogacao, atualizarDecisao, excluirDecisao } from "@/app/reunioes/actions";

function Bloco({ titulo, texto }: { titulo: string; texto: string | null }) {
  if (!texto) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className="whitespace-pre-wrap text-sm">{texto}</p>
    </div>
  );
}

export default async function DecisaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: decisao } = await supabase
    .from("decisions")
    .select("*, meetings(id, titulo), processes(id, titulo), tasks(id, titulo), okrs(id, titulo)")
    .eq("id", id)
    .maybeSingle();
  if (!decisao) notFound();

  const [{ areas, membros }, reunioes, vinculos, { data: participantes }] = await Promise.all([
    getAreasEMembros(),
    getReunioesRecentes(),
    getVinculosTarefa(),
    supabase.from("decision_participants").select("profile_id").eq("decision_id", id),
  ]);

  const idsParticipantes = (participantes ?? []).map((p) => p.profile_id);
  const responsavel = membros.find((m) => m.id === decisao.responsavel_id);
  const reuniao = decisao.meetings as { id: string; titulo: string } | null;
  const processo = decisao.processes as { id: string; titulo: string } | null;
  const tarefa = decisao.tasks as { id: string; titulo: string } | null;
  const okr = decisao.okrs as { id: string; titulo: string } | null;

  return (
    <AppShell>
      <div className="flex max-w-3xl flex-col gap-8">
        <PageHeader
          title={decisao.titulo}
          back={{ href: "/decisoes", label: "Decisões" }}
          actions={decisao.status === "revogada" ? <Badge variant="outline">Revogada</Badge> : <Badge>Vigente</Badge>}
          description={`${formatarData(decisao.data, { ano: true })} · responsável: ${nomeDe(responsavel)}${
            decisao.prazo ? ` · prazo ${formatarData(decisao.prazo, { ano: true })}` : ""
          }`}
        />

        <div className="flex flex-col gap-4 rounded-lg border p-4">
          <Bloco titulo="Contexto" texto={decisao.contexto} />
          <Bloco titulo="Decisão" texto={decisao.decisao} />
          <Bloco titulo="Motivo" texto={decisao.motivo} />
          <Bloco titulo="Impacto esperado" texto={decisao.impacto_esperado} />
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {reuniao && (
              <Link href={`/reunioes/${reuniao.id}`} className="text-primary hover:underline">
                Reunião: {reuniao.titulo}
              </Link>
            )}
            {processo && (
              <Link href={`/processos/${processo.id}`} className="text-primary hover:underline">
                Processo: {processo.titulo}
              </Link>
            )}
            {tarefa && (
              <Link href={`/rotinas/${tarefa.id}`} className="text-primary hover:underline">
                Tarefa: {tarefa.titulo}
              </Link>
            )}
            {okr && (
              <Link href={`/okrs/${okr.id}`} className="text-primary hover:underline">
                OKR: {okr.titulo}
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <form action={alternarRevogacao.bind(null, id, decisao.status !== "revogada")}>
            <Button type="submit" size="sm" variant="outline">
              {decisao.status === "revogada" ? "Tornar vigente de novo" : "Revogar decisão"}
            </Button>
          </form>
          {!decisao.task_id && (
            <Link
              href={`/rotinas/nova?processo=${decisao.process_id ?? ""}&okr=${decisao.okr_id ?? ""}`}
              className="inline-flex h-8 items-center rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              + Criar tarefa para executar
            </Link>
          )}
        </div>

        <Section title="Editar">
          <form action={atualizarDecisao.bind(null, id)} className="flex flex-col gap-4 rounded-lg border p-4">
            <DecisionFields
              areas={opcoesAreas(areas)}
              membros={membros}
              reunioes={reunioes}
              processos={vinculos.processos}
              okrs={vinculos.okrs}
              decisao={decisao}
              participantes={idsParticipantes}
            />
            <Button type="submit" size="sm" className="self-start">
              Salvar alterações
            </Button>
          </form>
        </Section>

        <Section title="Anexos">
          <Attachments entidade="decision" entidadeId={id} caminhoPagina={`/decisoes/${id}`} />
        </Section>

        <Section title="Histórico de alterações">
          <History tabela="decisions" registroId={id} />
        </Section>

        <form action={excluirDecisao.bind(null, id)} className="border-t pt-4">
          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
            Excluir decisão
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
