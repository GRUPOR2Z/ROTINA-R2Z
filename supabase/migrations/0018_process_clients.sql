-- Grupo R2Z OS — modulo de Clientes, Fase C: vincula processo da
-- biblioteca central a um cliente, sem duplicar conteudo (o processo
-- continua existindo em um lugar so; isso e' so a relacao).
--
-- `visivel_ao_cliente` ja fica na tabela pensando na Fase D
-- (compartilhamento externo) -- por enquanto so guarda o default,
-- ninguem externo existe ainda pra essa flag valer alguma coisa.

create table if not exists public.process_clients (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  visivel_ao_cliente boolean not null default false,
  vinculado_por uuid not null references public.profiles(id),
  vinculado_em timestamptz not null default now(),
  unique (process_id, client_id)
);

create index if not exists process_clients_process_id_idx on public.process_clients (process_id);
create index if not exists process_clients_client_id_idx on public.process_clients (client_id);

alter table public.process_clients enable row level security;

-- vincular/desvincular e' uma tag organizacional, nao edita o
-- processo em si -- mesma transparencia operacional aberta usada em
-- task_comments (qualquer interno cria/apaga).
create policy "process_clients: leitura para autenticados"
  on public.process_clients for select to authenticated using (true);

create policy "process_clients: qualquer autenticado vincula"
  on public.process_clients for insert to authenticated
  with check (vinculado_por = auth.uid());

create policy "process_clients: qualquer autenticado desvincula"
  on public.process_clients for delete to authenticated using (true);
