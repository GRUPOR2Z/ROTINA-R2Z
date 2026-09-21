-- Grupo R2Z OS — nucleo de tarefas (Fase 2, item 06 do backlog).
-- Recorrencia (recurring_routines/task_occurrences) entra numa
-- proxima migration, quando a funcionalidade for construida.

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  area_id uuid references public.areas(id),
  responsavel_id uuid references public.profiles(id),
  prioridade text not null default 'media' check (prioridade in ('baixa', 'media', 'alta')),
  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluida', 'bloqueada')),
  prazo date,
  bloqueio_motivo text,
  concluida_em timestamptz,
  criado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists tasks_responsavel_id_idx on public.tasks (responsavel_id);
create index if not exists tasks_area_id_idx on public.tasks (area_id);
create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_prazo_idx on public.tasks (prazo);

create table if not exists public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  descricao text not null,
  concluido boolean not null default false,
  criado_em timestamptz not null default now()
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  autor_id uuid not null references public.profiles(id),
  texto text not null,
  criado_em timestamptz not null default now()
);

create index if not exists task_checklist_items_task_id_idx on public.task_checklist_items (task_id);
create index if not exists task_comments_task_id_idx on public.task_comments (task_id);

create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists tasks_set_atualizado_em on public.tasks;
create trigger tasks_set_atualizado_em
  before update on public.tasks
  for each row execute function public.set_atualizado_em();

alter table public.tasks enable row level security;
alter table public.task_checklist_items enable row level security;
alter table public.task_comments enable row level security;

-- transparencia operacional: leitura ampla; escrita restrita a quem
-- e responsavel, quem criou, ou administrador.
create policy "tasks: leitura para autenticados"
  on public.tasks for select to authenticated using (true);

create policy "tasks: qualquer autenticado cria"
  on public.tasks for insert to authenticated
  with check (criado_por = auth.uid());

create policy "tasks: responsavel, criador ou administrador edita"
  on public.tasks for update to authenticated
  using (responsavel_id = auth.uid() or criado_por = auth.uid() or public.is_admin())
  with check (responsavel_id = auth.uid() or criado_por = auth.uid() or public.is_admin());

create policy "tasks: criador ou administrador exclui"
  on public.tasks for delete to authenticated
  using (criado_por = auth.uid() or public.is_admin());

create policy "task_checklist_items: leitura para autenticados"
  on public.task_checklist_items for select to authenticated using (true);

create policy "task_checklist_items: responsavel da tarefa ou administrador gerencia"
  on public.task_checklist_items for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.tasks t
      where t.id = task_id and (t.responsavel_id = auth.uid() or t.criado_por = auth.uid())
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.tasks t
      where t.id = task_id and (t.responsavel_id = auth.uid() or t.criado_por = auth.uid())
    )
  );

create policy "task_comments: leitura para autenticados"
  on public.task_comments for select to authenticated using (true);

create policy "task_comments: qualquer autenticado comenta"
  on public.task_comments for insert to authenticated
  with check (autor_id = auth.uid());
