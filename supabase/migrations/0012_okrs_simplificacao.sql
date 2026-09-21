-- Simplificacao pedida pelo Davi: o modelo ciclo -> objetivo ->
-- resultados-chave (0011) tinha camadas demais. Substituido por uma
-- entidade so, no mesmo molde do KPI: titulo, de quanto, para quanto,
-- historico de valores. As tabelas antigas ainda estao vazias (a
-- funcionalidade acabou de ser construida, sem dado real), entao
-- e' seguro derrubar e recriar.

drop table if exists public.key_result_updates;
drop table if exists public.key_results;
drop table if exists public.objectives;
drop table if exists public.okr_cycles;

create table if not exists public.okrs (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  area_id uuid references public.areas(id),
  responsavel_id uuid references public.profiles(id),
  tipo_meta text not null default 'unidade' check (tipo_meta in ('percentual', 'unidade')),
  unidade text,
  valor_inicial numeric,
  meta numeric not null,
  prazo date,
  ativo boolean not null default true,
  criado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.okr_values (
  id uuid primary key default gen_random_uuid(),
  okr_id uuid not null references public.okrs(id) on delete cascade,
  valor numeric not null,
  referencia_periodo date not null,
  comentario text,
  criado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now()
);

create index if not exists okrs_area_id_idx on public.okrs (area_id);
create index if not exists okr_values_okr_id_idx on public.okr_values (okr_id);

drop trigger if exists okrs_set_atualizado_em on public.okrs;
create trigger okrs_set_atualizado_em
  before update on public.okrs
  for each row execute function public.set_atualizado_em();

alter table public.okrs enable row level security;
alter table public.okr_values enable row level security;

create policy "okrs: leitura para autenticados"
  on public.okrs for select to authenticated using (true);

create policy "okrs: qualquer autenticado cria"
  on public.okrs for insert to authenticated
  with check (criado_por = auth.uid());

create policy "okrs: responsavel, criador ou administrador edita"
  on public.okrs for update to authenticated
  using (responsavel_id = auth.uid() or criado_por = auth.uid() or public.is_admin())
  with check (responsavel_id = auth.uid() or criado_por = auth.uid() or public.is_admin());

create policy "okrs: criador ou administrador exclui"
  on public.okrs for delete to authenticated
  using (criado_por = auth.uid() or public.is_admin());

create policy "okr_values: leitura para autenticados"
  on public.okr_values for select to authenticated using (true);

create policy "okr_values: responsavel do okr ou administrador registra"
  on public.okr_values for insert to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1 from public.okrs o
      where o.id = okr_id and (o.responsavel_id = auth.uid() or o.criado_por = auth.uid())
    )
  );

create policy "okr_values: responsavel do okr ou administrador exclui"
  on public.okr_values for delete to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.okrs o
      where o.id = okr_id and (o.responsavel_id = auth.uid() or o.criado_por = auth.uid())
    )
  );
