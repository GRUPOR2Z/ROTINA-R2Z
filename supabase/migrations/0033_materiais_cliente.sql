-- Grupo R2Z OS — materiais do cliente: abas "Processos" e "Roteiros".
--
-- Os processos de cada cliente sao criados por fora (Notion, Docs...) e
-- aqui ficam so como link. Os roteiros podem ser link ou PDF enviado pelo
-- sistema (bucket privado client-files, pasta = id do cliente).
--
-- Acesso: a equipe interna le e grava; o login de cliente so le os
-- materiais do proprio cliente (e baixa os PDFs dele).

create table if not exists public.client_materials (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  tipo text not null check (tipo in ('processo', 'roteiro')),
  titulo text not null,
  descricao text,
  url text,
  arquivo_caminho text,
  arquivo_nome text,
  criado_por uuid references public.profiles(id) on delete set null,
  criado_em timestamptz not null default now(),
  check (url is not null or arquivo_caminho is not null)
);

create index if not exists client_materials_cliente_idx
  on public.client_materials (client_id, tipo, criado_em desc);

alter table public.client_materials enable row level security;

create policy "client_materials: equipe le tudo, cliente le os seus"
  on public.client_materials for select to authenticated
  using ((select public.is_interno()) or public.cliente_ve(client_id));

create policy "client_materials: so equipe interna grava"
  on public.client_materials for all to authenticated
  using ((select public.is_interno())) with check ((select public.is_interno()));

-- PDFs (privados; download por URL assinada de curta duracao)
insert into storage.buckets (id, name, public)
values ('client-files', 'client-files', false)
on conflict (id) do nothing;

create policy "client-files: equipe le tudo, cliente le a propria pasta"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'client-files'
    and ((select public.is_interno()) or public.cliente_ve(((storage.foldername(name))[1])::uuid))
  );

create policy "client-files: equipe envia"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'client-files' and (select public.is_interno()));

create policy "client-files: equipe exclui"
  on storage.objects for delete to authenticated
  using (bucket_id = 'client-files' and (select public.is_interno()));
