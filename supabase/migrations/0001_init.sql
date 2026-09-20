-- Grupo R2Z OS — Fase 1: identidade & acesso
-- profiles, roles, areas, integration_logs + RLS

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text
);

insert into public.roles (nome, descricao) values
  ('administrador', 'Gerencia usuarios, permissoes, areas, configuracoes e integracoes.'),
  ('gestor', 'Acompanha areas, projetos, metas, processos e relatorios autorizados.'),
  ('colaborador', 'Executa tarefas, atualiza atividades e consulta processos permitidos.'),
  ('leitor', 'Consulta informacoes autorizadas.')
on conflict (nome) do nothing;

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

insert into public.areas (nome) values
  ('Comercial'), ('Operacional'), ('Gestao')
on conflict (nome) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  email text,
  cargo text,
  area_id uuid references public.areas(id),
  role_id uuid not null references public.roles(id),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.integration_logs (
  id uuid primary key default gen_random_uuid(),
  origem text not null,
  endpoint text not null,
  payload_recebido jsonb,
  status text not null default 'pendente' check (status in ('sucesso', 'erro', 'pendente')),
  chave_idempotencia text,
  erro_detalhe text,
  criado_em timestamptz not null default now()
);

create unique index if not exists integration_logs_idempotencia_key
  on public.integration_logs (chave_idempotencia)
  where chave_idempotencia is not null;

-- cria o profile automaticamente (role padrao: colaborador) quando um
-- usuario se autentica pela primeira vez
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  colaborador_role_id uuid;
begin
  select id into colaborador_role_id from public.roles where nome = 'colaborador';
  insert into public.profiles (id, nome, email, role_id)
  values (new.id, new.raw_user_meta_data ->> 'nome', new.email, colaborador_role_id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid() and r.nome = 'administrador'
  );
$$;

alter table public.roles enable row level security;
alter table public.areas enable row level security;
alter table public.profiles enable row level security;
alter table public.integration_logs enable row level security;

create policy "roles: leitura para autenticados"
  on public.roles for select to authenticated using (true);

create policy "areas: leitura para autenticados"
  on public.areas for select to authenticated using (true);

create policy "areas: escrita para administrador"
  on public.areas for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "profiles: leitura para autenticados"
  on public.profiles for select to authenticated using (true);

create policy "profiles: usuario edita o proprio perfil"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles: administrador gerencia todos"
  on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- integration_logs so e' acessivel via service_role (rotas de servidor);
-- nenhuma policy "authenticated" e' criada de proposito.
