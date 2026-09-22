-- Grupo R2Z OS — modulo de Clientes, Fase B: calendario da aba
-- Conteudo. `horario` nulo = evento de dia inteiro, igual convencao ja
-- usada em tasks.horario (item 07 do backlog) -- nao inventa um campo
-- dia_inteiro a parte.

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  titulo text not null,
  descricao text,
  tipo text,
  data date not null,
  horario time,
  task_id uuid references public.tasks(id) on delete set null,
  responsavel_id uuid references public.profiles(id),
  criado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists calendar_events_client_id_idx on public.calendar_events (client_id);
create index if not exists calendar_events_data_idx on public.calendar_events (data);

drop trigger if exists calendar_events_set_atualizado_em on public.calendar_events;
create trigger calendar_events_set_atualizado_em
  before update on public.calendar_events
  for each row execute function public.set_atualizado_em();

alter table public.calendar_events enable row level security;

-- mesmo padrao de tasks: leitura ampla, qualquer autenticado cria,
-- responsavel/criador/admin edita ou exclui.
create policy "calendar_events: leitura para autenticados"
  on public.calendar_events for select to authenticated using (true);

create policy "calendar_events: qualquer autenticado cria"
  on public.calendar_events for insert to authenticated
  with check (criado_por = auth.uid());

create policy "calendar_events: responsavel, criador ou administrador edita"
  on public.calendar_events for update to authenticated
  using (responsavel_id = auth.uid() or criado_por = auth.uid() or public.is_admin())
  with check (responsavel_id = auth.uid() or criado_por = auth.uid() or public.is_admin());

create policy "calendar_events: criador ou administrador exclui"
  on public.calendar_events for delete to authenticated
  using (criado_por = auth.uid() or public.is_admin());
