import { AppShell } from "@/components/layout/app-shell";
import { PageHeader, Section } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { SelectField } from "@/components/forms/select-field";
import { opcoesAreas } from "@/lib/opcoes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { descreverAlteracoes } from "@/lib/audit";
import { formatarDataHora, nomeDe, rel } from "@/lib/format";
import { alternarArea, atualizarArea, atualizarMembro, convidarMembro, criarArea } from "./actions";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { ErroBanner } from "@/components/layout/page-header";

const ROTULO_PAPEL: Record<string, string> = {
  administrador: "Administrador",
  gestor: "Gestor",
  colaborador: "Colaborador",
  leitor: "Leitor",
};

const ROTULO_TABELA: Record<string, string> = {
  tasks: "Tarefa",
  processes: "Processo",
  kpis: "KPI",
  okrs: "OKR",
  areas: "Área",
  profiles: "Usuário",
  clients: "Cliente",
  projects: "Projeto",
  decisions: "Decisão",
  meetings: "Reunião",
  improvement_items: "Melhoria",
};

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  const { erro, ok } = await searchParams;
  const eu = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: areas }, { data: membros }, { data: papeis }, { data: logs }] = await Promise.all([
    supabase.from("areas").select("id, nome, descricao, ativo").order("nome"),
    supabase.from("profiles").select("id, nome, email, cargo, area_id, role_id, ativo, roles(nome)").order("nome"),
    supabase.from("roles").select("id, nome"),
    supabase
      .from("audit_logs")
      .select("id, tabela, acao, alteracoes, criado_em, profiles(nome, email)")
      .in("tabela", ["areas", "profiles"])
      .order("criado_em", { ascending: false })
      .limit(20),
  ]);

  // logins de cliente sao geridos na pagina de cada cliente
  const opcoesPapel = (papeis ?? [])
    .filter((p) => p.nome !== "cliente")
    .map((p) => ({ value: p.id, label: ROTULO_PAPEL[p.nome] ?? p.nome }));
  const colaboradorId = (papeis ?? []).find((p) => p.nome === "colaborador")?.id ?? null;
  const equipe = (membros ?? []).filter((m) => rel<{ nome: string }>(m.roles)?.nome !== "cliente");
  const areasAtivas = (areas ?? []).filter((a) => a.ativo);

  if (!eu?.isAdmin) {
    return (
      <AppShell>
        <div className="flex flex-col gap-6">
          <PageHeader title="Configurações" />
          <EmptyState
            title="Acesso restrito"
            description="Áreas, usuários e permissões são gerenciados por administradores do Grupo R2Z."
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex max-w-4xl flex-col gap-10">
        <PageHeader title="Configurações" description="Áreas, usuários e permissões do Grupo R2Z." />

        <Section title="Áreas">
          <ul className="flex flex-col divide-y rounded-lg border">
            {(areas ?? []).map((a) => (
              <li key={a.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                <form action={atualizarArea.bind(null, a.id)} className="flex flex-1 flex-col gap-2 sm:flex-row">
                  <Input name="nome" defaultValue={a.nome} className="text-sm sm:w-48" aria-label="Nome da área" required />
                  <Input
                    name="descricao"
                    defaultValue={a.descricao ?? ""}
                    placeholder="Descrição"
                    className="flex-1 text-sm"
                    aria-label="Descrição da área"
                  />
                  <Button type="submit" size="sm" variant="outline">
                    Salvar
                  </Button>
                </form>
                <form action={alternarArea.bind(null, a.id, !a.ativo)}>
                  <Button type="submit" size="sm" variant="ghost" className={a.ativo ? "text-muted-foreground" : ""}>
                    {a.ativo ? "Desativar" : "Reativar"}
                  </Button>
                </form>
                {!a.ativo && <Badge variant="outline">Inativa</Badge>}
              </li>
            ))}
          </ul>
          <form action={criarArea} className="flex flex-col gap-2 sm:flex-row">
            <Input name="nome" placeholder="Nova área" className="text-sm sm:w-48" required />
            <Input name="descricao" placeholder="Descrição (opcional)" className="flex-1 text-sm" />
            <Button type="submit" size="sm">
              Criar área
            </Button>
          </form>
        </Section>

        <Section title="Usuários e permissões">
          <p id="equipe" className="-mt-2 scroll-mt-6 text-xs text-muted-foreground">
            O cadastro é fechado: só quem um administrador adiciona aqui consegue entrar. Administrador gerencia tudo;
            Gestor acompanha áreas e relatórios; Colaborador executa tarefas; Leitor só consulta. Usuário inativo perde o
            acesso.
          </p>
          {ok && (
            <p role="status" className="rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800">
              {ok}
            </p>
          )}
          <ErroBanner erro={erro} />
          <details className="rounded-lg border bg-card p-3" open={Boolean(erro)}>
            <summary className="cursor-pointer text-sm font-medium text-brand-900">+ Adicionar pessoa à equipe</summary>
            <form action={convidarMembro} className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="novo-nome">Nome</Label>
                <Input id="novo-nome" name="nome" required autoComplete="off" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="novo-email">E-mail</Label>
                <Input id="novo-email" name="email" type="email" required autoComplete="off" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="novo-senha">Senha provisória (mín. 8)</Label>
                <Input id="novo-senha" name="senha" type="text" minLength={8} required autoComplete="new-password" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="novo-cargo">Cargo</Label>
                <Input id="novo-cargo" name="cargo" autoComplete="off" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Área</Label>
                <SelectField name="area_id" options={opcoesAreas(areasAtivas)} emptyLabel="Sem área" placeholder="Área" className="" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Papel</Label>
                <SelectField name="role_id" options={opcoesPapel} defaultValue={colaboradorId} className="" />
              </div>
              <SubmitButton size="sm" className="self-start sm:col-span-3" pendingText="Adicionando…">
                Adicionar
              </SubmitButton>
            </form>
          </details>
          <ul className="flex flex-col divide-y rounded-lg border bg-card">
            {equipe.map((m) => {
              const papel = rel<{ nome: string }>(m.roles)?.nome;
              const ehEu = m.id === eu.id;
              return (
                <li key={m.id} className="p-3">
                  <form action={atualizarMembro.bind(null, m.id)} className="grid grid-cols-1 gap-2 sm:grid-cols-6 sm:items-end">
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <span className="truncate text-xs text-muted-foreground">
                        {m.email} {!m.ativo && <Badge variant="outline">Inativo</Badge>}
                      </span>
                      <Input name="nome" defaultValue={m.nome ?? ""} placeholder="Nome" className="text-sm" aria-label="Nome" />
                    </div>
                    <Input name="cargo" defaultValue={m.cargo ?? ""} placeholder="Cargo" className="text-sm" aria-label="Cargo" />
                    <SelectField name="area_id" options={opcoesAreas(areasAtivas)} defaultValue={m.area_id} emptyLabel="Sem área" placeholder="Área" className="" />
                    {ehEu ? (
                      <span className="text-sm text-muted-foreground">{ROTULO_PAPEL[papel ?? ""] ?? papel} (você)</span>
                    ) : (
                      <SelectField name="role_id" options={opcoesPapel} defaultValue={m.role_id} className="" />
                    )}
                    <div className="flex items-center gap-2">
                      {!ehEu && (
                        <SelectField
                          name="ativo"
                          options={[
                            { value: "true", label: "Ativo" },
                            { value: "false", label: "Inativo" },
                          ]}
                          defaultValue={m.ativo ? "true" : "false"}
                          className="flex-1"
                        />
                      )}
                      <Button type="submit" size="sm" variant="outline">
                        Salvar
                      </Button>
                    </div>
                  </form>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title="Registro de ações administrativas">
          {(logs ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma ação registrada ainda.</p>
          ) : (
            <ol className="flex flex-col gap-2 border-l pl-4">
              {logs!.map((l) => (
                <li key={l.id} className="text-sm">
                  <span className="font-medium">{nomeDe(rel(l.profiles))}</span>{" "}
                  <span className="text-muted-foreground">
                    {ROTULO_TABELA[l.tabela] ?? l.tabela}: {descreverAlteracoes(l.acao, l.alteracoes as Record<string, unknown> | null)}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">{formatarDataHora(l.criado_em)}</span>
                </li>
              ))}
            </ol>
          )}
        </Section>
      </div>
    </AppShell>
  );
}
