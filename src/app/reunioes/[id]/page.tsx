import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader, Section } from "@/components/layout/page-header";
import { MeetingFields } from "@/components/decisoes/fields";
import { SelectField } from "@/components/forms/select-field";
import { Attachments } from "@/components/documents/attachments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { getAreasEMembros } from "@/lib/lookups";
import { opcoesAreas, opcoesMembros } from "@/lib/opcoes";
import { formatarData, nomeDe, rel } from "@/lib/format";
import {
  adicionarEncaminhamento,
  atualizarReuniao,
  excluirReuniao,
  removerEncaminhamento,
  transformarEmTarefa,
} from "../actions";

export default async function ReuniaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: reuniao } = await supabase.from("meetings").select("*").eq("id", id).maybeSingle();
  if (!reuniao) notFound();

  const [{ areas, membros }, { data: participantes }, { data: itens }, { data: decisoes }] = await Promise.all([
    getAreasEMembros(),
    supabase.from("meeting_participants").select("profile_id").eq("meeting_id", id),
    supabase
      .from("meeting_action_items")
      .select("id, descricao, prazo, task_id, profiles(nome, email), tasks(status)")
      .eq("meeting_id", id)
      .order("criado_em"),
    supabase.from("decisions").select("id, titulo, status").eq("meeting_id", id).order("criado_em"),
  ]);

  const idsParticipantes = (participantes ?? []).map((p) => p.profile_id);
  const nomesParticipantes = membros.filter((m) => idsParticipantes.includes(m.id)).map((m) => nomeDe(m));

  return (
    <AppShell>
      <div className="flex max-w-3xl flex-col gap-8">
        <PageHeader
          title={reuniao.titulo}
          back={{ href: "/reunioes", label: "Reuniões" }}
          description={`${formatarData(reuniao.data, { ano: true })}${reuniao.horario ? ` · ${reuniao.horario.slice(0, 5)}` : ""}${
            nomesParticipantes.length ? ` · ${nomesParticipantes.join(", ")}` : ""
          }`}
        />

        <Section title="Encaminhamentos">
          {(itens ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum encaminhamento.</p>}
          {(itens ?? []).length > 0 && (
            <ul className="flex flex-col divide-y rounded-lg border">
              {itens!.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1">{e.descricao}</span>
                  <span className="text-xs text-muted-foreground">
                    {nomeDe(rel(e.profiles))} · {formatarData(e.prazo)}
                  </span>
                  {e.task_id ? (
                    <Link href={`/rotinas/${e.task_id}`} className="text-xs font-medium text-primary hover:underline">
                      Ver tarefa ({rel<{ status: string }>(e.tasks)?.status === "concluida" ? "concluída" : "aberta"})
                    </Link>
                  ) : (
                    <form action={transformarEmTarefa.bind(null, id, e.id)}>
                      <Button type="submit" size="sm" variant="outline" className="h-7 text-xs">
                        Transformar em tarefa
                      </Button>
                    </form>
                  )}
                  <form action={removerEncaminhamento.bind(null, id, e.id)}>
                    <Button type="submit" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" aria-label="Remover encaminhamento">
                      ×
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={adicionarEncaminhamento.bind(null, id)} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_12rem_9rem_auto]">
            <Input name="descricao" placeholder="Novo encaminhamento" className="text-sm" required />
            <SelectField name="responsavel_id" options={opcoesMembros(membros)} placeholder="Responsável" className="" />
            <Input name="prazo" type="date" className="text-sm" aria-label="Prazo" />
            <Button type="submit" size="sm" variant="outline">
              Adicionar
            </Button>
          </form>
        </Section>

        <Section
          title="Decisões tomadas"
          actions={
            <Link href={`/decisoes/nova?reuniao=${id}`} className="text-xs text-muted-foreground hover:text-foreground">
              + Registrar decisão
            </Link>
          }
        >
          {(decisoes ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma decisão registrada nesta reunião.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {decisoes!.map((d) => (
                <li key={d.id} className="flex items-center gap-2 text-sm">
                  <Link href={`/decisoes/${d.id}`} className="hover:underline">
                    {d.titulo}
                  </Link>
                  {d.status === "revogada" && <Badge variant="outline">Revogada</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Pauta e notas">
          <form action={atualizarReuniao.bind(null, id)} className="flex flex-col gap-4 rounded-lg border p-4">
            <MeetingFields areas={opcoesAreas(areas)} membros={membros} reuniao={reuniao} participantes={idsParticipantes} />
            <Button type="submit" size="sm" className="self-start">
              Salvar
            </Button>
          </form>
        </Section>

        <Section title="Anexos">
          <Attachments entidade="meeting" entidadeId={id} caminhoPagina={`/reunioes/${id}`} />
        </Section>

        <form action={excluirReuniao.bind(null, id)} className="border-t pt-4">
          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
            Excluir reunião
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
