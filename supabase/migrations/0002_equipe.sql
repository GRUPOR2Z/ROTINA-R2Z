-- Grupo R2Z OS — perfil de equipe: competencias (tags livres) e
-- resultados/falhas (registro manual). Painel calculado (tarefas
-- concluidas/atrasadas) depende da tabela "tasks", ainda nao criada
-- (Fase 2) — fica para quando ela existir.

create table if not exists public.member_tags (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  tag text not null,
  criado_em timestamptz not null default now(),
  unique (profile_id, tag)
);

create table if not exists public.member_notes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  tipo text not null check (tipo in ('resultado', 'falha')),
  texto text not null,
  autor_id uuid not null references public.profiles(id),
  criado_em timestamptz not null default now()
);

create index if not exists member_notes_profile_id_idx on public.member_notes (profile_id);

alter table public.member_tags enable row level security;
alter table public.member_notes enable row level security;

-- tags: leitura para todos autenticados (transparencia operacional);
-- escrita para administrador ou para a propria pessoa.
create policy "member_tags: leitura para autenticados"
  on public.member_tags for select to authenticated using (true);

create policy "member_tags: administrador ou dono gerencia"
  on public.member_tags for all to authenticated
  using (public.is_admin() or profile_id = auth.uid())
  with check (public.is_admin() or profile_id = auth.uid());

-- notas de resultado/falha: conteudo sensivel (Doc. 2, "restringir
-- informacoes sensiveis") — cada um le a sua, administrador le e
-- escreve todas.
create policy "member_notes: administrador gerencia todas"
  on public.member_notes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "member_notes: dono le as proprias"
  on public.member_notes for select to authenticated
  using (profile_id = auth.uid());
