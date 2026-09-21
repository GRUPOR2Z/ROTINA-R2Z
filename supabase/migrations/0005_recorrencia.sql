-- Grupo R2Z OS — recorrencia de tarefas (item 07 do backlog).
-- Regra simples, como combinado: um botao "repete toda semana/dia/mes"
-- que gera a proxima ocorrencia automaticamente quando a atual e'
-- concluida. recurring_routines guarda so a regra (frequencia); os
-- dados da tarefa (titulo, area, responsavel...) vivem em cada task,
-- copiados da ocorrencia anterior ao gerar a proxima.

create table if not exists public.recurring_routines (
  id uuid primary key default gen_random_uuid(),
  frequencia text not null check (frequencia in ('diaria', 'semanal', 'mensal')),
  ativa boolean not null default true,
  criado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now()
);

create table if not exists public.task_occurrences (
  id uuid primary key default gen_random_uuid(),
  recurring_routine_id uuid not null references public.recurring_routines(id) on delete cascade,
  task_id uuid not null unique references public.tasks(id) on delete cascade,
  data_prevista date,
  gerada_em timestamptz not null default now()
);

create index if not exists task_occurrences_routine_id_idx on public.task_occurrences (recurring_routine_id);

alter table public.recurring_routines enable row level security;
alter table public.task_occurrences enable row level security;

create policy "recurring_routines: leitura para autenticados"
  on public.recurring_routines for select to authenticated using (true);

create policy "recurring_routines: qualquer autenticado cria"
  on public.recurring_routines for insert to authenticated
  with check (criado_por = auth.uid());

create policy "recurring_routines: criador ou administrador atualiza"
  on public.recurring_routines for update to authenticated
  using (criado_por = auth.uid() or public.is_admin())
  with check (criado_por = auth.uid() or public.is_admin());

create policy "task_occurrences: leitura para autenticados"
  on public.task_occurrences for select to authenticated using (true);

create policy "task_occurrences: dono da tarefa insere"
  on public.task_occurrences for insert to authenticated
  with check (
    exists (
      select 1 from public.tasks t
      where t.id = task_id and (t.criado_por = auth.uid() or t.responsavel_id = auth.uid())
    )
  );
