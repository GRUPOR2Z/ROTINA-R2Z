-- Grupo R2Z OS — Banco de melhorias (Doc. 2; Fase 2).
-- Problemas, ideias e oportunidades. Aprovada -> vira tarefa ou
-- iniciativa de OKR (task_id/okr_id guardam o vinculo); depois de
-- implementada, registra o resultado.

create table if not exists public.improvement_items (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'ideia' check (tipo in ('problema', 'ideia', 'oportunidade')),
  titulo text not null,
  descricao text,
  area_id uuid references public.areas(id),
  autor_id uuid not null references public.profiles(id),
  responsavel_id uuid references public.profiles(id),
  prioridade text not null default 'media' check (prioridade in ('baixa', 'media', 'alta')),
  impacto smallint check (impacto between 1 and 5),
  esforco smallint check (esforco between 1 and 5),
  status text not null default 'nova' check (
    status in ('nova', 'em_analise', 'aprovada', 'em_implementacao', 'implementada', 'descartada')
  ),
  task_id uuid references public.tasks(id) on delete set null,
  okr_id uuid references public.okrs(id) on delete set null,
  process_id uuid references public.processes(id) on delete set null,
  resultado text,
  implementada_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists improvement_items_status_idx on public.improvement_items (status);
create index if not exists improvement_items_area_id_idx on public.improvement_items (area_id);

drop trigger if exists improvement_items_set_atualizado_em on public.improvement_items;
create trigger improvement_items_set_atualizado_em
  before update on public.improvement_items
  for each row execute function public.set_atualizado_em();

drop trigger if exists improvement_items_auditoria on public.improvement_items;
create trigger improvement_items_auditoria
  after insert or update or delete on public.improvement_items
  for each row execute function public.registrar_auditoria();

alter table public.improvement_items enable row level security;

create policy "improvement_items: leitura para autenticados"
  on public.improvement_items for select to authenticated using (true);

-- qualquer pessoa registra (cultura de melhoria continua)
create policy "improvement_items: qualquer autenticado registra"
  on public.improvement_items for insert to authenticated
  with check (autor_id = auth.uid());

-- aprovar/descartar e' de gestor ou admin; autor e responsavel editam
create or replace function public.is_gestor_ou_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid() and r.nome in ('administrador', 'gestor')
  );
$$;

create policy "improvement_items: autor, responsavel, gestor ou administrador edita"
  on public.improvement_items for update to authenticated
  using (autor_id = auth.uid() or responsavel_id = auth.uid() or public.is_gestor_ou_admin())
  with check (autor_id = auth.uid() or responsavel_id = auth.uid() or public.is_gestor_ou_admin());

create policy "improvement_items: autor ou administrador exclui"
  on public.improvement_items for delete to authenticated
  using (autor_id = auth.uid() or public.is_admin());
