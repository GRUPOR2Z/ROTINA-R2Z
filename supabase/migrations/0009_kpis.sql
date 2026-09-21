-- Grupo R2Z OS — KPIs (Fase 3). Definicao separada do historico de
-- valores, como o Doc. 3 pede.

create table if not exists public.kpis (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  area_id uuid references public.areas(id),
  responsavel_id uuid references public.profiles(id),
  formula text,
  unidade text,
  fonte text,
  periodicidade text not null default 'mensal' check (periodicidade in ('diaria', 'semanal', 'mensal', 'trimestral')),
  meta numeric,
  -- direcao decide o farol: pra "maior_melhor" (ex: receita), valor
  -- baixo e' ruim; pra "menor_melhor" (ex: churn), valor alto e' ruim.
  direcao text not null default 'maior_melhor' check (direcao in ('maior_melhor', 'menor_melhor')),
  limiar_atencao numeric,
  limiar_critico numeric,
  ativo boolean not null default true,
  criado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.kpi_values (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid not null references public.kpis(id) on delete cascade,
  valor numeric not null,
  tipo_valor text not null default 'manual' check (tipo_valor in ('real', 'estimado', 'manual', 'importado', 'calculado')),
  referencia_periodo date not null,
  fonte_importacao text,
  criado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now()
);

create index if not exists kpis_area_id_idx on public.kpis (area_id);
create index if not exists kpi_values_kpi_id_idx on public.kpi_values (kpi_id);
create index if not exists kpi_values_referencia_periodo_idx on public.kpi_values (referencia_periodo);

drop trigger if exists kpis_set_atualizado_em on public.kpis;
create trigger kpis_set_atualizado_em
  before update on public.kpis
  for each row execute function public.set_atualizado_em();

alter table public.kpis enable row level security;
alter table public.kpi_values enable row level security;

create policy "kpis: leitura para autenticados"
  on public.kpis for select to authenticated using (true);

create policy "kpis: qualquer autenticado cria"
  on public.kpis for insert to authenticated
  with check (criado_por = auth.uid());

create policy "kpis: responsavel, criador ou administrador edita"
  on public.kpis for update to authenticated
  using (responsavel_id = auth.uid() or criado_por = auth.uid() or public.is_admin())
  with check (responsavel_id = auth.uid() or criado_por = auth.uid() or public.is_admin());

create policy "kpis: criador ou administrador exclui"
  on public.kpis for delete to authenticated
  using (criado_por = auth.uid() or public.is_admin());

create policy "kpi_values: leitura para autenticados"
  on public.kpi_values for select to authenticated using (true);

create policy "kpi_values: responsavel do kpi ou administrador registra"
  on public.kpi_values for insert to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1 from public.kpis k
      where k.id = kpi_id and (k.responsavel_id = auth.uid() or k.criado_por = auth.uid())
    )
  );

create policy "kpi_values: responsavel do kpi ou administrador exclui"
  on public.kpi_values for delete to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.kpis k
      where k.id = kpi_id and (k.responsavel_id = auth.uid() or k.criado_por = auth.uid())
    )
  );
