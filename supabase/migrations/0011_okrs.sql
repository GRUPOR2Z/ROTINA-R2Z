-- Grupo R2Z OS — OKRs (Fase 3). Ciclo -> objetivos -> resultados-chave.

create table if not exists public.okr_cycles (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null default 'trimestral' check (tipo in ('trimestral', 'semestral', 'personalizado')),
  data_inicio date not null,
  data_fim date not null,
  status text not null default 'ativo' check (status in ('ativo', 'encerrado')),
  criado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now()
);

create table if not exists public.objectives (
  id uuid primary key default gen_random_uuid(),
  okr_cycle_id uuid not null references public.okr_cycles(id) on delete cascade,
  titulo text not null,
  descricao text,
  area_id uuid references public.areas(id),
  responsavel_id uuid references public.profiles(id),
  criado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now()
);

create table if not exists public.key_results (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references public.objectives(id) on delete cascade,
  titulo text not null,
  unidade text,
  valor_inicial numeric not null default 0,
  valor_atual numeric not null default 0,
  valor_alvo numeric not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.key_result_updates (
  id uuid primary key default gen_random_uuid(),
  key_result_id uuid not null references public.key_results(id) on delete cascade,
  valor_novo numeric not null,
  comentario text,
  autor_id uuid not null references public.profiles(id),
  criado_em timestamptz not null default now()
);

create index if not exists objectives_okr_cycle_id_idx on public.objectives (okr_cycle_id);
create index if not exists key_results_objective_id_idx on public.key_results (objective_id);
create index if not exists key_result_updates_key_result_id_idx on public.key_result_updates (key_result_id);

drop trigger if exists key_results_set_atualizado_em on public.key_results;
create trigger key_results_set_atualizado_em
  before update on public.key_results
  for each row execute function public.set_atualizado_em();

alter table public.okr_cycles enable row level security;
alter table public.objectives enable row level security;
alter table public.key_results enable row level security;
alter table public.key_result_updates enable row level security;

create policy "okr_cycles: leitura para autenticados"
  on public.okr_cycles for select to authenticated using (true);

create policy "okr_cycles: qualquer autenticado cria"
  on public.okr_cycles for insert to authenticated
  with check (criado_por = auth.uid());

create policy "okr_cycles: criador ou administrador atualiza"
  on public.okr_cycles for update to authenticated
  using (criado_por = auth.uid() or public.is_admin())
  with check (criado_por = auth.uid() or public.is_admin());

create policy "okr_cycles: criador ou administrador exclui"
  on public.okr_cycles for delete to authenticated
  using (criado_por = auth.uid() or public.is_admin());

create policy "objectives: leitura para autenticados"
  on public.objectives for select to authenticated using (true);

create policy "objectives: qualquer autenticado cria"
  on public.objectives for insert to authenticated
  with check (criado_por = auth.uid());

create policy "objectives: responsavel, criador ou administrador atualiza"
  on public.objectives for update to authenticated
  using (responsavel_id = auth.uid() or criado_por = auth.uid() or public.is_admin())
  with check (responsavel_id = auth.uid() or criado_por = auth.uid() or public.is_admin());

create policy "objectives: criador ou administrador exclui"
  on public.objectives for delete to authenticated
  using (criado_por = auth.uid() or public.is_admin());

create policy "key_results: leitura para autenticados"
  on public.key_results for select to authenticated using (true);

create policy "key_results: dono do objetivo ou administrador gerencia"
  on public.key_results for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.objectives o
      where o.id = objective_id and (o.responsavel_id = auth.uid() or o.criado_por = auth.uid())
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.objectives o
      where o.id = objective_id and (o.responsavel_id = auth.uid() or o.criado_por = auth.uid())
    )
  );

create policy "key_result_updates: leitura para autenticados"
  on public.key_result_updates for select to authenticated using (true);

create policy "key_result_updates: dono do resultado-chave registra"
  on public.key_result_updates for insert to authenticated
  with check (
    autor_id = auth.uid()
    and (
      public.is_admin()
      or exists (
        select 1 from public.key_results kr
        join public.objectives o on o.id = kr.objective_id
        where kr.id = key_result_id and (o.responsavel_id = auth.uid() or o.criado_por = auth.uid())
      )
    )
  );
