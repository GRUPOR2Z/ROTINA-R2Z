-- Grupo R2Z OS — Onboarding (Doc. 2; Fase 2). Trilha por cargo/perfil
-- -> etapas (processo, documento, tarefa pratica, conversa) -> pessoa
-- inscrita na trilha com mentor e prazo -> progresso por etapa.

create table if not exists public.onboarding_tracks (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  cargo text,
  area_id uuid references public.areas(id),
  ativo boolean not null default true,
  criado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.onboarding_steps (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.onboarding_tracks(id) on delete cascade,
  ordem integer not null default 0,
  titulo text not null,
  descricao text,
  tipo text not null default 'leitura' check (tipo in ('leitura', 'pratica', 'documento', 'conversa')),
  process_id uuid references public.processes(id) on delete set null,
  responsavel_id uuid references public.profiles(id),
  -- prazo relativo: dias a partir do inicio da pessoa na trilha
  prazo_dias integer,
  criado_em timestamptz not null default now()
);

create table if not exists public.onboarding_assignments (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.onboarding_tracks(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  mentor_id uuid references public.profiles(id),
  data_inicio date not null default current_date,
  prazo date,
  concluido_em timestamptz,
  criado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now(),
  unique (track_id, profile_id)
);

create table if not exists public.onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.onboarding_assignments(id) on delete cascade,
  step_id uuid not null references public.onboarding_steps(id) on delete cascade,
  concluido_em timestamptz not null default now(),
  concluido_por uuid not null references public.profiles(id),
  observacao text,
  unique (assignment_id, step_id)
);

create index if not exists onboarding_steps_track_id_idx on public.onboarding_steps (track_id, ordem);
create index if not exists onboarding_assignments_profile_id_idx on public.onboarding_assignments (profile_id);
create index if not exists onboarding_progress_assignment_id_idx on public.onboarding_progress (assignment_id);

drop trigger if exists onboarding_tracks_set_atualizado_em on public.onboarding_tracks;
create trigger onboarding_tracks_set_atualizado_em
  before update on public.onboarding_tracks
  for each row execute function public.set_atualizado_em();

alter table public.onboarding_tracks enable row level security;
alter table public.onboarding_steps enable row level security;
alter table public.onboarding_assignments enable row level security;
alter table public.onboarding_progress enable row level security;

-- montar trilha e inscrever pessoas: gestor ou admin
create policy "onboarding_tracks: leitura para autenticados"
  on public.onboarding_tracks for select to authenticated using (true);
create policy "onboarding_tracks: gestor ou administrador gerencia"
  on public.onboarding_tracks for all to authenticated
  using (public.is_gestor_ou_admin()) with check (public.is_gestor_ou_admin());

create policy "onboarding_steps: leitura para autenticados"
  on public.onboarding_steps for select to authenticated using (true);
create policy "onboarding_steps: gestor ou administrador gerencia"
  on public.onboarding_steps for all to authenticated
  using (public.is_gestor_ou_admin()) with check (public.is_gestor_ou_admin());

create policy "onboarding_assignments: leitura para autenticados"
  on public.onboarding_assignments for select to authenticated using (true);
create policy "onboarding_assignments: gestor ou administrador gerencia"
  on public.onboarding_assignments for all to authenticated
  using (public.is_gestor_ou_admin()) with check (public.is_gestor_ou_admin());
-- mentor pode marcar a inscricao como concluida
create policy "onboarding_assignments: mentor atualiza"
  on public.onboarding_assignments for update to authenticated
  using (mentor_id = auth.uid()) with check (mentor_id = auth.uid());

-- progresso: a propria pessoa, o mentor ou gestor/admin marcam etapa
create or replace function public.pode_marcar_onboarding(p_assignment_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select public.is_gestor_ou_admin() or exists (
    select 1 from public.onboarding_assignments a
    where a.id = p_assignment_id and (a.profile_id = auth.uid() or a.mentor_id = auth.uid())
  );
$$;

create policy "onboarding_progress: leitura para autenticados"
  on public.onboarding_progress for select to authenticated using (true);
create policy "onboarding_progress: pessoa, mentor ou gestor marca"
  on public.onboarding_progress for insert to authenticated
  with check (concluido_por = auth.uid() and public.pode_marcar_onboarding(assignment_id));
create policy "onboarding_progress: pessoa, mentor ou gestor desmarca"
  on public.onboarding_progress for delete to authenticated
  using (public.pode_marcar_onboarding(assignment_id));

-- fecha/reabre a inscricao conforme o progresso. Trigger (security
-- definer) porque quem marca a ultima etapa pode ser a propria pessoa,
-- que nao tem permissao de update na inscricao.
create or replace function public.atualizar_conclusao_onboarding()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_assignment uuid := coalesce(new.assignment_id, old.assignment_id);
  v_total integer;
  v_feitas integer;
begin
  select count(*) into v_total
  from public.onboarding_steps s
  join public.onboarding_assignments a on a.track_id = s.track_id
  where a.id = v_assignment;

  select count(*) into v_feitas from public.onboarding_progress where assignment_id = v_assignment;

  update public.onboarding_assignments
  set concluido_em = case when v_total > 0 and v_feitas >= v_total then coalesce(concluido_em, now()) else null end
  where id = v_assignment;

  return null;
end;
$$;

drop trigger if exists onboarding_progress_conclusao on public.onboarding_progress;
create trigger onboarding_progress_conclusao
  after insert or delete on public.onboarding_progress
  for each row execute function public.atualizar_conclusao_onboarding();
