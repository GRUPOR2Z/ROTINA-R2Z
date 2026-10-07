-- Grupo R2Z OS — fecha as pontas do MVP (Doc. 2 / Doc. 3):
--   * audit_logs: historico de alteracoes via trigger (Doc. 3 §6
--     "registrar acoes administrativas e alteracoes importantes")
--   * tasks: subtarefas, justificativa sem prazo, vinculos com
--     processo / KPI / OKR
--   * documents + bucket privado: anexos e evidencias de qualquer modulo
--   * processes: problemas comuns, links, frequencia de revisao,
--     substituto e flag de processo critico
--   * process_suggestions: sugestao de alteracao que NAO mexe na versao
--     publicada (Doc. 2, Processos)

-- ---------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tabela text not null,
  registro_id uuid not null,
  acao text not null check (acao in ('insert', 'update', 'delete')),
  autor_id uuid references public.profiles(id) on delete set null,
  alteracoes jsonb,
  criado_em timestamptz not null default now()
);

create index if not exists audit_logs_registro_idx on public.audit_logs (tabela, registro_id);
create index if not exists audit_logs_criado_em_idx on public.audit_logs (criado_em desc);

-- generica: grava o diff (campo -> {de, para}) no update, a linha
-- inteira no insert/delete. security definer porque ninguem tem
-- policy de escrita em audit_logs -- so o trigger escreve.
create or replace function public.registrar_auditoria()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  antigo jsonb;
  novo jsonb;
  diff jsonb := '{}'::jsonb;
  chave text;
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs (tabela, registro_id, acao, autor_id, alteracoes)
    values (tg_table_name, new.id, 'insert', auth.uid(), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_logs (tabela, registro_id, acao, autor_id, alteracoes)
    values (tg_table_name, old.id, 'delete', auth.uid(), to_jsonb(old));
    return old;
  end if;

  antigo := to_jsonb(old);
  novo := to_jsonb(new);
  for chave in select jsonb_object_keys(novo) loop
    if chave <> 'atualizado_em' and (novo -> chave) is distinct from (antigo -> chave) then
      diff := diff || jsonb_build_object(chave, jsonb_build_object('de', antigo -> chave, 'para', novo -> chave));
    end if;
  end loop;

  if diff <> '{}'::jsonb then
    insert into public.audit_logs (tabela, registro_id, acao, autor_id, alteracoes)
    values (tg_table_name, new.id, 'update', auth.uid(), diff);
  end if;
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['tasks', 'processes', 'kpis', 'okrs', 'areas', 'profiles', 'clients'] loop
    execute format('drop trigger if exists %I_auditoria on public.%I', t, t);
    execute format(
      'create trigger %I_auditoria after insert or update or delete on public.%I for each row execute function public.registrar_auditoria()',
      t, t
    );
  end loop;
end;
$$;

alter table public.audit_logs enable row level security;

-- transparencia operacional: o historico de uma tarefa/processo e'
-- visivel pra quem ve o registro (todo interno). Escrita: so trigger.
create policy "audit_logs: leitura para autenticados"
  on public.audit_logs for select to authenticated using (true);

-- ---------------------------------------------------------------
-- tasks: subtarefas, justificativa, vinculos
-- ---------------------------------------------------------------
alter table public.tasks
  add column if not exists parent_task_id uuid references public.tasks(id) on delete cascade,
  add column if not exists justificativa_sem_prazo text,
  add column if not exists process_id uuid references public.processes(id) on delete set null,
  add column if not exists kpi_id uuid references public.kpis(id) on delete set null,
  add column if not exists okr_id uuid references public.okrs(id) on delete set null;

create index if not exists tasks_parent_task_id_idx on public.tasks (parent_task_id);
create index if not exists tasks_process_id_idx on public.tasks (process_id);
create index if not exists tasks_kpi_id_idx on public.tasks (kpi_id);
create index if not exists tasks_okr_id_idx on public.tasks (okr_id);

-- ---------------------------------------------------------------
-- documents (anexos / evidencias / links) + bucket privado
-- ---------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  entidade text not null check (
    entidade in ('task', 'project', 'process', 'meeting', 'decision', 'improvement', 'onboarding_step', 'client')
  ),
  entidade_id uuid not null,
  nome text not null,
  -- um dos dois: arquivo no Storage (caminho) ou link externo (url)
  caminho text,
  url text,
  tipo_mime text,
  tamanho_bytes bigint,
  eh_evidencia boolean not null default false,
  enviado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now(),
  check (caminho is not null or url is not null)
);

create index if not exists documents_entidade_idx on public.documents (entidade, entidade_id);

alter table public.documents enable row level security;

create policy "documents: leitura para autenticados"
  on public.documents for select to authenticated using (true);

create policy "documents: qualquer autenticado anexa"
  on public.documents for insert to authenticated
  with check (enviado_por = auth.uid());

create policy "documents: quem enviou ou administrador exclui"
  on public.documents for delete to authenticated
  using (enviado_por = auth.uid() or public.is_admin());

-- privado (diferente de client-avatars): anexo pode ter dado sensivel,
-- download so por URL assinada gerada no servidor.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents: autenticado le"
  on storage.objects for select to authenticated
  using (bucket_id = 'documents');

create policy "documents: autenticado envia"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'documents');

create policy "documents: dono ou administrador exclui arquivo"
  on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (owner = auth.uid() or public.is_admin()));

-- ---------------------------------------------------------------
-- processes: campos que faltavam do Doc. 2
-- ---------------------------------------------------------------
alter table public.processes
  add column if not exists problemas_comuns text,
  add column if not exists links text,
  add column if not exists frequencia_revisao_dias integer,
  add column if not exists ultima_revisao_em date,
  add column if not exists critico boolean not null default false,
  add column if not exists substituto_id uuid references public.profiles(id);

create index if not exists processes_substituto_id_idx on public.processes (substituto_id);

create table if not exists public.process_suggestions (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes(id) on delete cascade,
  autor_id uuid not null references public.profiles(id),
  texto text not null,
  status text not null default 'aberta' check (status in ('aberta', 'aceita', 'recusada')),
  resposta text,
  respondido_por uuid references public.profiles(id),
  respondido_em timestamptz,
  criado_em timestamptz not null default now()
);

create index if not exists process_suggestions_process_id_idx on public.process_suggestions (process_id);

alter table public.process_suggestions enable row level security;

create policy "process_suggestions: leitura para autenticados"
  on public.process_suggestions for select to authenticated using (true);

create policy "process_suggestions: qualquer autenticado sugere"
  on public.process_suggestions for insert to authenticated
  with check (autor_id = auth.uid());

-- responder (aceitar/recusar) e' de quem cuida do processo
create policy "process_suggestions: dono do processo ou administrador responde"
  on public.process_suggestions for update to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.processes p
      where p.id = process_id and (p.responsavel_id = auth.uid() or p.criado_por = auth.uid())
    )
  );
