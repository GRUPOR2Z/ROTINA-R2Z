import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader, Section } from "@/components/layout/page-header";
import { SelectField } from "@/components/forms/select-field";
import { Attachments } from "@/components/documents/attachments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { getAreasEMembros, getVinculosTarefa } from "@/lib/lookups";
import { opcoesAreas, opcoesMembros } from "@/lib/opcoes";
import { TIPOS_ETAPA, rotuloTipoEtapa } from "@/lib/onboarding";
import { dateKey } from "@/lib/calendar";
import { nomeDe, rel } from "@/lib/format";
import { adicionarEtapa, atualizarTrilha, inscreverPessoa, moverEtapa, removerEtapa } from "../../actions";

export default async function TrilhaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trilha } = await supabase.from("onboarding_tracks").select("*").eq("id", id).maybeSingle();
  if (!trilha) notFound();

  const [{ areas, membros }, vinculos, { data: etapas }] = await Promise.all([
    getAreasEMembros(),
    getVinculosTarefa(),
    supabase
      .from("onboarding_steps")
      .select("id, ordem, titulo, descricao, tipo, prazo_dias, processes(id, titulo), profiles(nome, email)")
      .eq("track_id", id)
      .order("ordem"),
  ]);

  const opcoesPessoas = opcoesMembros(membros);

  return (
    <AppShell>
      <div className="flex max-w-3xl flex-col gap-8">
        <PageHeader
          title={trilha.nome}
          back={{ href: "/onboarding", label: "Onboarding" }}
          description={trilha.cargo ?? undefined}
          actions={!trilha.ativo ? <Badge variant="outline">Inativa</Badge> : undefined}
        />

        <Section title={`Etapas (${(etapas ?? []).length})`}>
          {(etapas ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhuma etapa ainda.</p>}
          <ol className="flex flex-col gap-2">
            {(etapas ?? []).map((e, idx) => {
              const processo = rel<{ id: string; titulo: string }>(e.processes);
              return (
                <li key={e.id} className="flex gap-3 rounded-lg border p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {idx + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                    <span className="font-medium">{e.titulo}</span>
                    <span className="text-xs text-muted-foreground">
                      {rotuloTipoEtapa(e.tipo)}
                      {e.prazo_dias != null && ` · até o dia ${e.prazo_dias}`}
                      {e.profiles ? ` · com ${nomeDe(rel(e.profiles))}` : null}
                    </span>
                    {e.descricao && <p className="whitespace-pre-wrap text-muted-foreground">{e.descricao}</p>}
                    {processo && (
                      <Link href={`/processos/${processo.id}`} className="text-xs text-primary hover:underline">
                        Processo: {processo.titulo}
                      </Link>
                    )}
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">Documentos da etapa</summary>
                      <div className="mt-2">
                        <Attachments entidade="onboarding_step" entidadeId={e.id} caminhoPagina={`/onboarding/trilhas/${id}`} />
                      </div>
                    </details>
                  </div>
                  <div className="flex shrink-0 flex-col">
                    <form action={moverEtapa.bind(null, id, e.id, -1)}>
                      <Button type="submit" variant="ghost" size="icon" className="h-6 w-6" aria-label="Subir etapa" disabled={idx === 0}>
                        ↑
                      </Button>
                    </form>
                    <form action={moverEtapa.bind(null, id, e.id, 1)}>
                      <Button type="submit" variant="ghost" size="icon" className="h-6 w-6" aria-label="Descer etapa" disabled={idx === (etapas ?? []).length - 1}>
                        ↓
                      </Button>
                    </form>
                    <form action={removerEtapa.bind(null, id, e.id)}>
                      <Button type="submit" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" aria-label="Remover etapa">
                        ×
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ol>

          <form action={adicionarEtapa.bind(null, id)} className="flex flex-col gap-3 rounded-lg border border-dashed p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_12rem]">
              <Input name="titulo" placeholder="Nova etapa" className="text-sm" required />
              <SelectField name="tipo" options={TIPOS_ETAPA.map((t) => ({ ...t }))} defaultValue="leitura" className="" />
            </div>
            <Textarea name="descricao" placeholder="Instruções (opcional)" className="min-h-14 text-sm" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SelectField name="process_id" options={vinculos.processos} placeholder="Processo (opcional)" emptyLabel="Nenhum" className="" />
              <SelectField name="responsavel_id" options={opcoesPessoas} placeholder="Quem acompanha" emptyLabel="Ninguém" className="" />
              <Input name="prazo_dias" type="number" min={0} placeholder="Até o dia nº" className="text-sm" aria-label="Prazo em dias a partir do início" />
            </div>
            <Button type="submit" size="sm" variant="outline" className="self-start">
              Adicionar etapa
            </Button>
          </form>
        </Section>

        <Section title="Inscrever pessoa">
          <form action={inscreverPessoa.bind(null, id)} className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2">
            <SelectField name="profile_id" label="Pessoa" options={opcoesPessoas} />
            <SelectField name="mentor_id" label="Mentor" options={opcoesPessoas} emptyLabel="Nenhum" />
            <div className="flex flex-col gap-2">
              <Label htmlFor="data_inicio">Início</Label>
              <Input id="data_inicio" name="data_inicio" type="date" defaultValue={dateKey(new Date())} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="prazo">Prazo de conclusão</Label>
              <Input id="prazo" name="prazo" type="date" />
            </div>
            <Button type="submit" size="sm" className="self-start">
              Inscrever
            </Button>
          </form>
        </Section>

        <Section title="Dados da trilha">
          <form action={atualizarTrilha.bind(null, id)} className="flex flex-col gap-4 rounded-lg border p-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" defaultValue={trilha.nome} required />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cargo">Cargo / perfil</Label>
                <Input id="cargo" name="cargo" defaultValue={trilha.cargo ?? ""} />
              </div>
              <SelectField name="area_id" label="Área" options={opcoesAreas(areas)} defaultValue={trilha.area_id} emptyLabel="Sem área" />
              <SelectField
                name="ativo"
                label="Situação"
                options={[
                  { value: "true", label: "Ativa" },
                  { value: "false", label: "Inativa" },
                ]}
                defaultValue={trilha.ativo ? "true" : "false"}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" name="descricao" defaultValue={trilha.descricao ?? ""} />
            </div>
            <Button type="submit" size="sm" className="self-start">
              Salvar
            </Button>
          </form>
        </Section>
      </div>
    </AppShell>
  );
}
