-- Grupo R2Z OS — calendario de conteudo: status e aprovacao pelo cliente.
--
-- Fluxo: planejado -> em_producao -> em_aprovacao -> (cliente) aprovado
-- ou ajustes -> ... -> publicado. A equipe muda qualquer status; o
-- cliente so responde (aprova ou pede ajuste com comentario) os posts que
-- estao "em_aprovacao", e so pela funcao responder_post: as tabelas
-- continuam sem nenhuma permissao de escrita para ele (0026).

alter table public.calendar_events
  add column if not exists status text not null default 'planejado',
  add column if not exists comentario_cliente text,
  add column if not exists respondido_em timestamptz,
  add column if not exists respondido_por uuid references public.profiles(id) on delete set null;

alter table public.calendar_events
  add constraint calendar_events_status_check
  check (status in ('planejado', 'em_producao', 'em_aprovacao', 'ajustes', 'aprovado', 'publicado'));

create index if not exists calendar_events_status_idx on public.calendar_events (client_id, status);

-- resposta do cliente a um post em aprovacao
create or replace function public.responder_post(p_event_id uuid, p_aprovado boolean, p_comentario text default null)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_client uuid;
  v_status text;
begin
  select client_id, status into v_client, v_status
  from public.calendar_events where id = p_event_id;

  if v_client is null or not (public.cliente_ve(v_client) or public.is_interno()) then
    return 'sem_acesso';
  end if;
  if v_status <> 'em_aprovacao' then
    return 'fora_de_aprovacao';
  end if;
  if not p_aprovado and coalesce(trim(p_comentario), '') = '' then
    return 'comentario_obrigatorio';
  end if;

  update public.calendar_events
  set status = case when p_aprovado then 'aprovado' else 'ajustes' end,
      comentario_cliente = nullif(trim(p_comentario), ''),
      respondido_em = now(),
      respondido_por = auth.uid()
  where id = p_event_id;

  return 'ok';
end;
$$;

grant execute on function public.responder_post(uuid, boolean, text) to authenticated;
