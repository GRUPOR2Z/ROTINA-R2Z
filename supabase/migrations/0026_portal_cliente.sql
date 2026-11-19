-- Grupo R2Z OS — Portal do cliente (Clientes, Fase D).
--
-- O cliente ganha um login proprio e ve so a "aba" dele no hub: o
-- calendario de conteudo e os processos marcados como visiveis, sem
-- editar nada e sem acesso as outras areas (como no Notion).
--
-- Seguranca: as policies existentes liberam leitura para qualquer
-- usuario autenticado. Em vez de reescrever cada uma, cada tabela ganha
-- uma policy RESTRICTIVE (que soma um "E" a todas as outras):
--   * equipe interna (qualquer papel que nao seja "cliente") continua
--     exatamente como antes;
--   * usuario "cliente" so passa onde a policy abre (o proprio cliente,
--     o calendario dele e os processos visiveis) e nunca grava nada.

insert into public.roles (nome, descricao) values
  ('cliente', 'Cliente externo: ve so a propria aba (calendario de conteudo e processos), sem editar nada.')
on conflict (nome) do nothing;

-- calendario de conteudo: rede social e formato de cada post
alter table public.calendar_events
  add column if not exists rede text,
  add column if not exists formato text;

-- quais logins de cliente enxergam quais clientes
create table if not exists public.client_members (
  client_id uuid not null references public.clients(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  criado_por uuid references public.profiles(id),
  criado_em timestamptz not null default now(),
  primary key (client_id, profile_id)
);

create index if not exists client_members_profile_id_idx on public.client_members (profile_id);

alter table public.client_members enable row level security;

-- ---------------------------------------------------------------
-- funcoes de apoio (security definer: leem profiles/client_members
-- sem passar pelo RLS, evitando recursao nas policies)
-- ---------------------------------------------------------------
create or replace function public.is_interno()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid() and r.nome <> 'cliente'
  );
$$;

create or replace function public.cliente_ve(p_client_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.client_members m
    where m.client_id = p_client_id and m.profile_id = auth.uid()
  );
$$;

create or replace function public.cliente_ve_processo(p_process_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1
    from public.process_clients pc
    join public.client_members m on m.client_id = pc.client_id
    where pc.process_id = p_process_id
      and pc.visivel_ao_cliente
      and m.profile_id = auth.uid()
  );
$$;

create policy "client_members: equipe le tudo, cliente le os proprios"
  on public.client_members for select to authenticated
  using ((select public.is_interno()) or profile_id = auth.uid());

create policy "client_members: administrador gerencia"
  on public.client_members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------
-- tabelas que o cliente pode LER (com filtro); gravar, nunca
-- ---------------------------------------------------------------
create policy "portal: cliente le so o proprio cadastro"
  on public.clients as restrictive for select to authenticated
  using ((select public.is_interno()) or public.cliente_ve(id));

create policy "portal: cliente le so o proprio calendario"
  on public.calendar_events as restrictive for select to authenticated
  using ((select public.is_interno()) or public.cliente_ve(client_id));

create policy "portal: cliente le so vinculos visiveis"
  on public.process_clients as restrictive for select to authenticated
  using ((select public.is_interno()) or (visivel_ao_cliente and public.cliente_ve(client_id)));

create policy "portal: cliente le so processos visiveis"
  on public.processes as restrictive for select to authenticated
  using ((select public.is_interno()) or public.cliente_ve_processo(id));

create policy "portal: cliente le so o proprio perfil"
  on public.profiles as restrictive for select to authenticated
  using ((select public.is_interno()) or id = auth.uid());

do $$
declare
  t text;
begin
  foreach t in array array['clients', 'calendar_events', 'process_clients', 'processes', 'profiles'] loop
    execute format(
      'create policy "portal: so equipe interna insere" on public.%I as restrictive for insert to authenticated with check ((select public.is_interno()))',
      t
    );
    execute format(
      'create policy "portal: so equipe interna altera" on public.%I as restrictive for update to authenticated using ((select public.is_interno())) with check ((select public.is_interno()))',
      t
    );
    execute format(
      'create policy "portal: so equipe interna exclui" on public.%I as restrictive for delete to authenticated using ((select public.is_interno()))',
      t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------
-- todas as outras tabelas: cliente nao le nem grava nada
-- (roles fica de fora: so tem os nomes dos papeis)
-- ---------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in
    select tablename from pg_tables
    where schemaname = 'public'
      and tablename not in ('roles', 'client_members', 'clients', 'calendar_events', 'process_clients', 'processes', 'profiles')
  loop
    execute format(
      'create policy "portal: so equipe interna" on public.%I as restrictive for all to authenticated using ((select public.is_interno())) with check ((select public.is_interno()))',
      t
    );
  end loop;
end;
$$;

-- arquivos: anexos internos (bucket documents) e upload de fotos so
-- para a equipe; a foto do cliente (bucket publico) segue legivel
create policy "portal: anexos so para equipe interna"
  on storage.objects as restrictive for select to authenticated
  using (bucket_id <> 'documents' or (select public.is_interno()));

create policy "portal: upload so equipe interna"
  on storage.objects as restrictive for insert to authenticated
  with check ((select public.is_interno()));

create policy "portal: alteracao de arquivo so equipe interna"
  on storage.objects as restrictive for update to authenticated
  using ((select public.is_interno())) with check ((select public.is_interno()));

create policy "portal: exclusao de arquivo so equipe interna"
  on storage.objects as restrictive for delete to authenticated
  using ((select public.is_interno()));
