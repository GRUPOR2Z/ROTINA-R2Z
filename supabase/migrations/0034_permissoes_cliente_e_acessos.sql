-- Grupo R2Z OS — permissoes por login de cliente + aba "Acessos".
--
-- 1) Cada login de cliente (client_members) ganha permissoes por area:
--      calendario | tarefas | processos | roteiros | acessos
--    com as acoes "ver", "criar" e "editar". Excluir continua so da
--    equipe. O padrao repete o que o portal ja mostrava (ver calendario,
--    processos e roteiros), entao quem ja tinha login nao muda nada.
-- 2) client_credentials: contas do cliente (Instagram, Meta, Google...),
--    com a senha CRIPTOGRAFADA pelo app (AES-256-GCM, chave so no
--    servidor); o banco nunca guarda a senha legivel.
--
-- As regras restritivas da 0026 ("so equipe interna") passam a consultar
-- public.cliente_pode(cliente, area, acao) em vez de barrar tudo.

alter table public.client_members
  add column if not exists permissoes jsonb not null
  default '{"calendario":["ver"],"processos":["ver"],"roteiros":["ver"],"tarefas":[],"acessos":[]}'::jsonb;

create or replace function public.cliente_pode(p_client_id uuid, p_modulo text, p_acao text)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.client_members m
    where m.client_id = p_client_id
      and m.profile_id = auth.uid()
      and coalesce(m.permissoes -> p_modulo, '[]'::jsonb) ? p_acao
  );
$$;

-- "abc" -> null em vez de erro (pasta de arquivo que nao e' um uuid)
create or replace function public.uuid_ou_nulo(p_texto text)
returns uuid
language plpgsql
immutable
set search_path = public
as $$
begin
  return p_texto::uuid;
exception when others then
  return null;
end;
$$;

grant execute on function public.cliente_pode(uuid, text, text) to authenticated;
grant execute on function public.uuid_ou_nulo(text) to authenticated;

-- ---------------------------------------------------------------
-- calendario de conteudo
-- ---------------------------------------------------------------
alter policy "portal: cliente le so o proprio calendario" on public.calendar_events
  using ((select public.is_interno()) or public.cliente_pode(client_id, 'calendario', 'ver'));

alter policy "portal: so equipe interna insere" on public.calendar_events
  with check ((select public.is_interno()) or public.cliente_pode(client_id, 'calendario', 'criar'));

alter policy "portal: so equipe interna altera" on public.calendar_events
  using ((select public.is_interno()) or public.cliente_pode(client_id, 'calendario', 'editar'))
  with check ((select public.is_interno()) or public.cliente_pode(client_id, 'calendario', 'editar'));

create policy "calendar_events: cliente com permissao edita"
  on public.calendar_events for update to authenticated
  using (public.cliente_pode(client_id, 'calendario', 'editar'))
  with check (public.cliente_pode(client_id, 'calendario', 'editar'));

-- ---------------------------------------------------------------
-- tarefas (so as ligadas ao cliente)
-- ---------------------------------------------------------------
alter policy "portal: so equipe interna" on public.tasks
  using (
    (select public.is_interno())
    or (client_id is not null and public.cliente_pode(client_id, 'tarefas', 'ver'))
  )
  with check (
    (select public.is_interno())
    or (client_id is not null and (public.cliente_pode(client_id, 'tarefas', 'criar') or public.cliente_pode(client_id, 'tarefas', 'editar')))
  );

create policy "portal: cliente cria tarefa so com permissao"
  on public.tasks as restrictive for insert to authenticated
  with check ((select public.is_interno()) or public.cliente_pode(client_id, 'tarefas', 'criar'));

create policy "portal: cliente edita tarefa so com permissao"
  on public.tasks as restrictive for update to authenticated
  using ((select public.is_interno()) or public.cliente_pode(client_id, 'tarefas', 'editar'));

create policy "portal: so equipe interna exclui tarefa"
  on public.tasks as restrictive for delete to authenticated
  using ((select public.is_interno()));

create policy "tasks: cliente com permissao edita"
  on public.tasks for update to authenticated
  using (public.cliente_pode(client_id, 'tarefas', 'editar'))
  with check (public.cliente_pode(client_id, 'tarefas', 'editar'));

-- ---------------------------------------------------------------
-- processos e roteiros (client_materials) + PDFs
-- ---------------------------------------------------------------
create or replace function public.modulo_do_material(p_tipo text)
returns text
language sql
immutable
set search_path = public
as $$
  select case when p_tipo = 'processo' then 'processos' else 'roteiros' end;
$$;

grant execute on function public.modulo_do_material(text) to authenticated;

alter policy "client_materials: equipe le tudo, cliente le os seus" on public.client_materials
  using ((select public.is_interno()) or public.cliente_pode(client_id, public.modulo_do_material(tipo), 'ver'));

create policy "client_materials: cliente com permissao cria"
  on public.client_materials for insert to authenticated
  with check (criado_por = auth.uid() and public.cliente_pode(client_id, public.modulo_do_material(tipo), 'criar'));

create policy "client_materials: cliente com permissao edita"
  on public.client_materials for update to authenticated
  using (public.cliente_pode(client_id, public.modulo_do_material(tipo), 'editar'))
  with check (public.cliente_pode(client_id, public.modulo_do_material(tipo), 'editar'));

alter policy "client-files: equipe le tudo, cliente le a propria pasta" on storage.objects
  using (
    bucket_id = 'client-files'
    and ((select public.is_interno()) or public.cliente_pode(public.uuid_ou_nulo((storage.foldername(name))[1]), 'roteiros', 'ver'))
  );

alter policy "portal: upload so equipe interna" on storage.objects
  with check (
    (select public.is_interno())
    or (bucket_id = 'client-files' and public.cliente_pode(public.uuid_ou_nulo((storage.foldername(name))[1]), 'roteiros', 'criar'))
  );

create policy "client-files: cliente com permissao envia"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'client-files'
    and public.cliente_pode(public.uuid_ou_nulo((storage.foldername(name))[1]), 'roteiros', 'criar')
  );

-- ---------------------------------------------------------------
-- acessos (contas do cliente)
-- ---------------------------------------------------------------
create table if not exists public.client_credentials (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  servico text not null,
  login text,
  senha_cifrada text,
  url text,
  observacoes text,
  criado_por uuid references public.profiles(id) on delete set null,
  atualizado_por uuid references public.profiles(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists client_credentials_client_idx on public.client_credentials (client_id, servico);

create trigger client_credentials_set_atualizado_em
  before update on public.client_credentials
  for each row execute function public.set_atualizado_em();

alter table public.client_credentials enable row level security;

create policy "client_credentials: equipe ou cliente com permissao le"
  on public.client_credentials for select to authenticated
  using ((select public.is_interno()) or public.cliente_pode(client_id, 'acessos', 'ver'));

create policy "client_credentials: equipe ou cliente com permissao cria"
  on public.client_credentials for insert to authenticated
  with check ((select public.is_interno()) or public.cliente_pode(client_id, 'acessos', 'criar'));

create policy "client_credentials: equipe ou cliente com permissao edita"
  on public.client_credentials for update to authenticated
  using ((select public.is_interno()) or public.cliente_pode(client_id, 'acessos', 'editar'))
  with check ((select public.is_interno()) or public.cliente_pode(client_id, 'acessos', 'editar'));

create policy "client_credentials: so equipe exclui"
  on public.client_credentials for delete to authenticated
  using ((select public.is_interno()));
