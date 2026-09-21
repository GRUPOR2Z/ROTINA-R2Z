-- Grupo R2Z OS — biblioteca de processos (itens 09-11 do backlog).
-- processes = registro vivo (o que esta publicado agora); process_versions
-- = snapshot imutavel a cada publicacao, preservando o historico mesmo
-- que o processo seja editado depois.

create table if not exists public.processes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  area_id uuid references public.areas(id),
  responsavel_id uuid references public.profiles(id),
  objetivo text,
  pre_requisitos text,
  gatilho text,
  entradas text,
  passo_a_passo text,
  saidas text,
  criterios_conclusao text,
  status text not null default 'rascunho' check (status in ('rascunho', 'revisao', 'publicado', 'arquivado')),
  versao_publicada_id uuid,
  criado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.process_versions (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes(id) on delete cascade,
  numero_versao integer not null,
  snapshot jsonb not null,
  publicado_por uuid not null references public.profiles(id),
  publicado_em timestamptz not null default now(),
  unique (process_id, numero_versao)
);

alter table public.processes
  add constraint processes_versao_publicada_fkey
  foreign key (versao_publicada_id) references public.process_versions(id);

create index if not exists processes_area_id_idx on public.processes (area_id);
create index if not exists processes_status_idx on public.processes (status);
create index if not exists process_versions_process_id_idx on public.process_versions (process_id);

drop trigger if exists processes_set_atualizado_em on public.processes;
create trigger processes_set_atualizado_em
  before update on public.processes
  for each row execute function public.set_atualizado_em();

alter table public.processes enable row level security;
alter table public.process_versions enable row level security;

create policy "processes: leitura para autenticados"
  on public.processes for select to authenticated using (true);

create policy "processes: qualquer autenticado cria"
  on public.processes for insert to authenticated
  with check (criado_por = auth.uid());

create policy "processes: responsavel, criador ou administrador edita"
  on public.processes for update to authenticated
  using (responsavel_id = auth.uid() or criado_por = auth.uid() or public.is_admin())
  with check (responsavel_id = auth.uid() or criado_por = auth.uid() or public.is_admin());

create policy "processes: criador ou administrador exclui"
  on public.processes for delete to authenticated
  using (criado_por = auth.uid() or public.is_admin());

create policy "process_versions: leitura para autenticados"
  on public.process_versions for select to authenticated using (true);

create policy "process_versions: responsavel, criador ou administrador publica"
  on public.process_versions for insert to authenticated
  with check (
    exists (
      select 1 from public.processes p
      where p.id = process_id
        and (p.responsavel_id = auth.uid() or p.criado_por = auth.uid() or public.is_admin())
    )
  );
