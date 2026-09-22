-- Grupo R2Z OS — modulo de Clientes e Projetos (Fase A: fundacao).
-- Propriedades sao um schema generico (definicao + valor), no estilo
-- Notion, em vez de colunas fixas -- decisao explicita do Davi pra
-- poder criar/ocultar/reordenar campos por tipo de cliente sem
-- migration nova a cada propriedade.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo_cliente text,
  avatar_url text,
  capa_url text,
  arquivado boolean not null default false,
  criado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists clients_tipo_cliente_idx on public.clients (tipo_cliente);
create index if not exists clients_arquivado_idx on public.clients (arquivado);

drop trigger if exists clients_set_atualizado_em on public.clients;
create trigger clients_set_atualizado_em
  before update on public.clients
  for each row execute function public.set_atualizado_em();

-- tipo_cliente nulo = campo vale pra todos os clientes; preenchido =
-- so pra clientes daquele tipo. Duas unicidades parciais porque nulo
-- nao colide com nulo num "unique (tipo_cliente, chave)" comum.
create table if not exists public.client_property_definitions (
  id uuid primary key default gen_random_uuid(),
  tipo_cliente text,
  chave text not null,
  rotulo text not null,
  tipo_campo text not null check (
    tipo_campo in ('texto', 'numero', 'moeda', 'data', 'booleano', 'select', 'multi_select', 'usuario', 'url')
  ),
  opcoes jsonb,
  obrigatorio boolean not null default false,
  -- visibilidade padrao quando a pagina do cliente for compartilhada
  -- com um externo (Fase D); por enquanto so documenta a intencao.
  padrao_visivel_ao_cliente boolean not null default false,
  ordem integer not null default 0,
  ativo boolean not null default true,
  criado_por uuid not null references public.profiles(id),
  criado_em timestamptz not null default now()
);

create unique index if not exists client_property_definitions_chave_global_key
  on public.client_property_definitions (chave)
  where tipo_cliente is null;

create unique index if not exists client_property_definitions_chave_tipo_key
  on public.client_property_definitions (tipo_cliente, chave)
  where tipo_cliente is not null;

create index if not exists client_property_definitions_ordem_idx
  on public.client_property_definitions (ordem);

create table if not exists public.client_property_values (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  property_definition_id uuid not null references public.client_property_definitions(id) on delete cascade,
  valor jsonb,
  atualizado_por uuid not null references public.profiles(id),
  atualizado_em timestamptz not null default now(),
  unique (client_id, property_definition_id)
);

create index if not exists client_property_values_client_id_idx
  on public.client_property_values (client_id);

drop trigger if exists client_property_values_set_atualizado_em on public.client_property_values;
create trigger client_property_values_set_atualizado_em
  before update on public.client_property_values
  for each row execute function public.set_atualizado_em();

alter table public.clients enable row level security;
alter table public.client_property_definitions enable row level security;
alter table public.client_property_values enable row level security;

-- transparencia operacional, igual tasks/processes/kpis/okrs: qualquer
-- interno le tudo. Acesso restrito por cliente (externos) e' escopo da
-- Fase D, com um modelo de auth separado -- nao mexe nessa policy.
create policy "clients: leitura para autenticados"
  on public.clients for select to authenticated using (true);

create policy "clients: qualquer autenticado cria"
  on public.clients for insert to authenticated
  with check (criado_por = auth.uid());

-- sem "responsavel" fixo aqui (isso agora e' propriedade dinamica);
-- edicao/exclusao do registro do cliente fica com quem criou ou admin.
create policy "clients: criador ou administrador edita"
  on public.clients for update to authenticated
  using (criado_por = auth.uid() or public.is_admin())
  with check (criado_por = auth.uid() or public.is_admin());

create policy "clients: criador ou administrador exclui"
  on public.clients for delete to authenticated
  using (criado_por = auth.uid() or public.is_admin());

-- schema de propriedades (criar/editar/ocultar/reordenar campo) e'
-- decisao administrativa, mesmo padrao de "areas".
create policy "client_property_definitions: leitura para autenticados"
  on public.client_property_definitions for select to authenticated using (true);

create policy "client_property_definitions: escrita para administrador"
  on public.client_property_definitions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- valores de propriedade sao dado operacional do time (MRR, situacao,
-- etc.) -- qualquer interno mantem atualizado, igual comentario de
-- tarefa. Reavaliar quando client_members (Fase D) existir.
create policy "client_property_values: leitura para autenticados"
  on public.client_property_values for select to authenticated using (true);

create policy "client_property_values: qualquer autenticado escreve"
  on public.client_property_values for all to authenticated
  using (true)
  with check (atualizado_por = auth.uid());
