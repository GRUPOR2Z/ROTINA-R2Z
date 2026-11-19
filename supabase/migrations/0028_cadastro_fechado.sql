-- Grupo R2Z OS — cadastro fechado.
--
-- A tela publica "Criar conta" saiu do sistema: quem entra e' convidado
-- por um administrador (Configuracoes) ou ganha acesso de cliente (pagina
-- do cliente), e o papel e' definido nesse momento.
--
-- Defesa no banco, para o caso de alguem chamar a API de cadastro do
-- Supabase direto: todo usuario novo nasce com papel "cliente" e sem
-- vinculo a nenhum cliente, ou seja, sem acesso a nada. Antes nascia como
-- "colaborador" e enxergava os dados internos.
--
-- E usuario marcado como inativo em Configuracoes perde o acesso de fato
-- (antes o "inativo" era so um rotulo).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  papel_inicial uuid;
begin
  select id into papel_inicial from public.roles where nome = 'cliente';
  insert into public.profiles (id, nome, email, role_id)
  values (new.id, new.raw_user_meta_data ->> 'nome', new.email, papel_inicial)
  on conflict (id) do nothing;
  return new;
end;
$$;

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
    where p.id = auth.uid() and p.ativo and r.nome <> 'cliente'
  );
$$;
