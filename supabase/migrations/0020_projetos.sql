-- Grupo R2Z OS — Projetos (Doc. 2, "Operacional e projetos"; Fase 2).
-- projects = o projeto em si; project_members = equipe; project_deliverables
-- = checklist de entrega; project_processes = processos documentados
-- relacionados. As tarefas do projeto sao tasks comuns com project_id
-- (bloqueios/riscos de execucao continuam vivendo na tarefa).

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  area_id uuid references public.areas(id),
  responsavel_id uuid references public.profiles(id),
  client_id uuid references public.clients(id) on delete set null,
  status text not null default 'planejamento' check (
    status in ('planejamento', 'em_andamento', 'pausado', 'concluido', 'cancelado')
  ),
  data_inicio date,
  prazo date,
  riscos text,
  concluido_em timestamptz,
  criado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_area_id_idx on public.projects (area_id);
create index if not exists projects_responsavel_id_idx on public.projects (responsavel_id);
create index if not exists projects_client_id_idx on public.projects (client_id);

drop trigger if exists projects_set_atualizado_em on public.projects;
create trigger projects_set_atualizado_em
  before update on public.projects
  for each row execute function public.set_atualizado_em();

drop trigger if exists projects_auditoria on public.projects;
create trigger projects_auditoria
  after insert or update or delete on public.projects
  for each row execute function public.registrar_auditoria();

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  papel text,
  criado_em timestamptz not null default now(),
  unique (project_id, profile_id)
);

create table if not exists public.project_deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  descricao text not null,
  prazo date,
  concluido boolean not null default false,
  concluido_em timestamptz,
  criado_em timestamptz not null default now()
);

create table if not exists public.project_processes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  process_id uuid not null references public.processes(id) on delete cascade,
  criado_em timestamptz not null default now(),
  unique (project_id, process_id)
);

create index if not exists project_members_project_id_idx on public.project_members (project_id);
create index if not exists project_members_profile_id_idx on public.project_members (profile_id);
create index if not exists project_deliverables_project_id_idx on public.project_deliverables (project_id);
create index if not exists project_processes_project_id_idx on public.project_processes (project_id);

alter table public.tasks
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists tasks_project_id_idx on public.tasks (project_id);

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_deliverables enable row level security;
alter table public.project_processes enable row level security;

-- mesmo padrao de tasks/processes: leitura ampla, escrita pra
-- responsavel/criador/admin.
create or replace function public.pode_editar_projeto(p_project_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select public.is_admin() or exists (
    select 1 from public.projects p
    where p.id = p_project_id and (p.responsavel_id = auth.uid() or p.criado_por = auth.uid())
  );
$$;

create policy "projects: leitura para autenticados"
  on public.projects for select to authenticated using (true);

create policy "projects: qualquer autenticado cria"
  on public.projects for insert to authenticated
  with check (criado_por = auth.uid());

create policy "projects: responsavel, criador ou administrador edita"
  on public.projects for update to authenticated
  using (public.pode_editar_projeto(id))
  with check (public.pode_editar_projeto(id));

create policy "projects: criador ou administrador exclui"
  on public.projects for delete to authenticated
  using (criado_por = auth.uid() or public.is_admin());

create policy "project_members: leitura para autenticados"
  on public.project_members for select to authenticated using (true);

create policy "project_members: dono do projeto gerencia"
  on public.project_members for all to authenticated
  using (public.pode_editar_projeto(project_id))
  with check (public.pode_editar_projeto(project_id));

-- entrega: membros da equipe tambem marcam como concluida
create policy "project_deliverables: leitura para autenticados"
  on public.project_deliverables for select to authenticated using (true);

create policy "project_deliverables: dono ou membro do projeto gerencia"
  on public.project_deliverables for all to authenticated
  using (
    public.pode_editar_projeto(project_id)
    or exists (select 1 from public.project_members m where m.project_id = project_deliverables.project_id and m.profile_id = auth.uid())
  )
  with check (
    public.pode_editar_projeto(project_id)
    or exists (select 1 from public.project_members m where m.project_id = project_deliverables.project_id and m.profile_id = auth.uid())
  );

create policy "project_processes: leitura para autenticados"
  on public.project_processes for select to authenticated using (true);

create policy "project_processes: dono do projeto gerencia"
  on public.project_processes for all to authenticated
  using (public.pode_editar_projeto(project_id))
  with check (public.pode_editar_projeto(project_id));
