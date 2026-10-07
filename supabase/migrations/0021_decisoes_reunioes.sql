-- Grupo R2Z OS — Diario de decisoes e reunioes (Doc. 2; Fase 2).
-- Memoria organizacional: o que foi decidido, por que, por quem, e o
-- que saiu de cada reuniao. Encaminhamento vira tarefa (task_id guarda
-- o vinculo, sem duplicar o conteudo).

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  data date not null,
  horario time,
  area_id uuid references public.areas(id),
  pauta text,
  notas text,
  criado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.meeting_participants (
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  primary key (meeting_id, profile_id)
);

create table if not exists public.meeting_action_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  descricao text not null,
  responsavel_id uuid references public.profiles(id),
  prazo date,
  task_id uuid references public.tasks(id) on delete set null,
  criado_em timestamptz not null default now()
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  data date not null default current_date,
  contexto text,
  decisao text not null,
  motivo text,
  impacto_esperado text,
  responsavel_id uuid references public.profiles(id),
  prazo date,
  area_id uuid references public.areas(id),
  meeting_id uuid references public.meetings(id) on delete set null,
  process_id uuid references public.processes(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  -- "iniciativa" no modelo simplificado de OKR = vinculo com o OKR
  okr_id uuid references public.okrs(id) on delete set null,
  status text not null default 'vigente' check (status in ('vigente', 'revogada')),
  criado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.decision_participants (
  decision_id uuid not null references public.decisions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  primary key (decision_id, profile_id)
);

create index if not exists meetings_data_idx on public.meetings (data desc);
create index if not exists meeting_participants_profile_idx on public.meeting_participants (profile_id);
create index if not exists meeting_action_items_meeting_id_idx on public.meeting_action_items (meeting_id);
create index if not exists decisions_data_idx on public.decisions (data desc);
create index if not exists decisions_meeting_id_idx on public.decisions (meeting_id);
create index if not exists decisions_process_id_idx on public.decisions (process_id);
create index if not exists decision_participants_profile_idx on public.decision_participants (profile_id);

drop trigger if exists meetings_set_atualizado_em on public.meetings;
create trigger meetings_set_atualizado_em
  before update on public.meetings
  for each row execute function public.set_atualizado_em();

drop trigger if exists decisions_set_atualizado_em on public.decisions;
create trigger decisions_set_atualizado_em
  before update on public.decisions
  for each row execute function public.set_atualizado_em();

drop trigger if exists meetings_auditoria on public.meetings;
create trigger meetings_auditoria
  after insert or update or delete on public.meetings
  for each row execute function public.registrar_auditoria();

drop trigger if exists decisions_auditoria on public.decisions;
create trigger decisions_auditoria
  after insert or update or delete on public.decisions
  for each row execute function public.registrar_auditoria();

-- quem criou a reuniao, quem participou ou admin pode editar ata e
-- encaminhamentos
create or replace function public.pode_editar_reuniao(p_meeting_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select public.is_admin()
    or exists (select 1 from public.meetings m where m.id = p_meeting_id and m.criado_por = auth.uid())
    or exists (
      select 1 from public.meeting_participants mp
      where mp.meeting_id = p_meeting_id and mp.profile_id = auth.uid()
    );
$$;

alter table public.meetings enable row level security;
alter table public.meeting_participants enable row level security;
alter table public.meeting_action_items enable row level security;
alter table public.decisions enable row level security;
alter table public.decision_participants enable row level security;

create policy "meetings: leitura para autenticados"
  on public.meetings for select to authenticated using (true);
create policy "meetings: qualquer autenticado cria"
  on public.meetings for insert to authenticated with check (criado_por = auth.uid());
create policy "meetings: criador, participante ou administrador edita"
  on public.meetings for update to authenticated
  using (public.pode_editar_reuniao(id)) with check (public.pode_editar_reuniao(id));
create policy "meetings: criador ou administrador exclui"
  on public.meetings for delete to authenticated using (criado_por = auth.uid() or public.is_admin());

create policy "meeting_participants: leitura para autenticados"
  on public.meeting_participants for select to authenticated using (true);
-- o criador precisa conseguir inserir participantes logo depois de
-- criar a reuniao (ainda nao e' participante), por isso o "or criado_por"
create policy "meeting_participants: quem edita a reuniao gerencia"
  on public.meeting_participants for all to authenticated
  using (public.pode_editar_reuniao(meeting_id))
  with check (public.pode_editar_reuniao(meeting_id));

create policy "meeting_action_items: leitura para autenticados"
  on public.meeting_action_items for select to authenticated using (true);
create policy "meeting_action_items: quem edita a reuniao gerencia"
  on public.meeting_action_items for all to authenticated
  using (public.pode_editar_reuniao(meeting_id))
  with check (public.pode_editar_reuniao(meeting_id));

create policy "decisions: leitura para autenticados"
  on public.decisions for select to authenticated using (true);
create policy "decisions: qualquer autenticado registra"
  on public.decisions for insert to authenticated with check (criado_por = auth.uid());
create policy "decisions: responsavel, criador ou administrador edita"
  on public.decisions for update to authenticated
  using (responsavel_id = auth.uid() or criado_por = auth.uid() or public.is_admin())
  with check (responsavel_id = auth.uid() or criado_por = auth.uid() or public.is_admin());
create policy "decisions: criador ou administrador exclui"
  on public.decisions for delete to authenticated using (criado_por = auth.uid() or public.is_admin());

create policy "decision_participants: leitura para autenticados"
  on public.decision_participants for select to authenticated using (true);
create policy "decision_participants: quem edita a decisao gerencia"
  on public.decision_participants for all to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.decisions d
      where d.id = decision_id and (d.criado_por = auth.uid() or d.responsavel_id = auth.uid())
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.decisions d
      where d.id = decision_id and (d.criado_por = auth.uid() or d.responsavel_id = auth.uid())
    )
  );
