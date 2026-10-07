-- Grupo R2Z OS — Central de alertas (Doc. 2; Fase 2).
--
-- Alertas operacionais sao gerados por gerar_alertas(), uma funcao
-- idempotente: cada alerta tem uma `chave` unica (ex:
-- "tarefa_atrasada:<id>"), entao rodar de novo nao duplica. O que
-- deixou de valer (tarefa concluida, KPI atualizado...) e' marcado
-- como resolvido, nunca apagado -- alerta critico precisa de
-- rastreabilidade (Doc. 2 §4).
--
-- Hoje o app chama gerar_alertas() ao abrir a central/dashboard (com
-- trava de 5 min). Quando o n8n entrar, ele pode chamar a mesma funcao
-- num horario fixo e tambem inserir alertas com origem 'n8n' / 'ia'.

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (
    tipo in ('tarefa_atrasada', 'prazo_proximo', 'processo_revisao', 'kpi_desatualizado', 'falha_integracao', 'manual', 'ia')
  ),
  severidade text not null default 'atencao' check (severidade in ('info', 'atencao', 'critico')),
  titulo text not null,
  descricao text,
  link text,
  entidade text,
  entidade_id uuid,
  -- nulo = alerta geral (ex: falha de integracao), visivel a gestores/admin
  destinatario_id uuid references public.profiles(id) on delete cascade,
  chave text unique,
  origem text not null default 'sistema' check (origem in ('sistema', 'manual', 'n8n', 'ia')),
  task_id uuid references public.tasks(id) on delete set null,
  lido_em timestamptz,
  arquivado_em timestamptz,
  resolvido_em timestamptz,
  criado_por uuid references public.profiles(id),
  criado_em timestamptz not null default now()
);

create index if not exists alerts_destinatario_idx on public.alerts (destinatario_id, arquivado_em, lido_em);
create index if not exists alerts_criado_em_idx on public.alerts (criado_em desc);
create index if not exists alerts_entidade_idx on public.alerts (entidade, entidade_id);

-- preferencias: tipos silenciados por pessoa (evitar excesso de alertas)
create table if not exists public.alert_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  tipos_silenciados text[] not null default '{}',
  atualizado_em timestamptz not null default now()
);

-- trava simples pra nao recalcular a cada page view
create table if not exists public.alert_generation_state (
  id boolean primary key default true check (id),
  ultima_geracao timestamptz
);
insert into public.alert_generation_state (id, ultima_geracao) values (true, null) on conflict do nothing;

alter table public.alerts enable row level security;
alter table public.alert_preferences enable row level security;
alter table public.alert_generation_state enable row level security;

create policy "alerts: destinatario, gerais ou gestor le"
  on public.alerts for select to authenticated
  using (destinatario_id = auth.uid() or destinatario_id is null or public.is_gestor_ou_admin());

create policy "alerts: destinatario ou gestor atualiza (lido/arquivado/tarefa)"
  on public.alerts for update to authenticated
  using (destinatario_id = auth.uid() or public.is_gestor_ou_admin())
  with check (destinatario_id = auth.uid() or public.is_gestor_ou_admin());

create policy "alerts: alerta manual"
  on public.alerts for insert to authenticated
  with check (origem = 'manual' and criado_por = auth.uid());

create policy "alert_preferences: cada um as suas"
  on public.alert_preferences for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ---------------------------------------------------------------
-- geracao
-- ---------------------------------------------------------------
create or replace function public.gerar_alertas(p_forcar boolean default false)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_novos integer := 0;
begin
  -- so admin (ou o n8n via service_role) pode furar a trava
  if p_forcar and not (public.is_admin() or coalesce(auth.role(), '') = 'service_role') then
    p_forcar := false;
  end if;

  if not p_forcar and exists (
    select 1 from public.alert_generation_state
    where ultima_geracao is not null and ultima_geracao > now() - interval '5 minutes'
  ) then
    return 0;
  end if;

  update public.alert_generation_state set ultima_geracao = now();

  create temporary table if not exists _alertas_atuais (
    tipo text, severidade text, titulo text, descricao text, link text,
    entidade text, entidade_id uuid, destinatario_id uuid, chave text, task_id uuid
  ) on commit drop;
  truncate _alertas_atuais;

  -- tarefas atrasadas (so tarefa principal; subtarefa segue a mae)
  insert into _alertas_atuais
  select 'tarefa_atrasada',
         case when t.prioridade = 'alta' then 'critico' else 'atencao' end,
         'Tarefa atrasada: ' || t.titulo,
         'Prazo era ' || to_char(t.prazo, 'DD/MM/YYYY') || '.',
         '/rotinas/' || t.id, 'task', t.id, t.responsavel_id,
         'tarefa_atrasada:' || t.id, t.id
  from public.tasks t
  where t.status <> 'concluida' and t.prazo < current_date and t.parent_task_id is null;

  -- prazo nos proximos 2 dias
  insert into _alertas_atuais
  select 'prazo_proximo', 'info',
         'Prazo próximo: ' || t.titulo,
         'Vence em ' || to_char(t.prazo, 'DD/MM/YYYY') || '.',
         '/rotinas/' || t.id, 'task', t.id, t.responsavel_id,
         'prazo_proximo:' || t.id || ':' || t.prazo, t.id
  from public.tasks t
  where t.status <> 'concluida' and t.prazo between current_date and current_date + 2 and t.parent_task_id is null;

  -- processos aguardando revisao
  insert into _alertas_atuais
  select 'processo_revisao', 'info',
         'Processo em revisão: ' || p.titulo, null,
         '/processos/' || p.id, 'process', p.id, p.responsavel_id,
         'processo_revisao:' || p.id, null
  from public.processes p
  where p.status = 'revisao';

  -- processos com revisao periodica vencida
  insert into _alertas_atuais
  select 'processo_revisao', 'atencao',
         'Revisão vencida: ' || p.titulo,
         'Deveria ter sido revisado em ' || to_char(p.ultima_revisao_em + p.frequencia_revisao_dias, 'DD/MM/YYYY') || '.',
         '/processos/' || p.id, 'process', p.id, p.responsavel_id,
         'processo_revisao_vencida:' || p.id || ':' || (p.ultima_revisao_em + p.frequencia_revisao_dias), null
  from public.processes p
  where p.status = 'publicado'
    and p.frequencia_revisao_dias is not null
    and p.ultima_revisao_em is not null
    and p.ultima_revisao_em + p.frequencia_revisao_dias < current_date;

  -- processo critico sem substituto (dependencia de uma pessoa so)
  insert into _alertas_atuais
  select 'processo_revisao', 'atencao',
         'Processo crítico sem substituto: ' || p.titulo,
         'Defina um substituto para não depender de uma pessoa só.',
         '/processos/' || p.id, 'process', p.id, p.responsavel_id,
         'processo_sem_substituto:' || p.id, null
  from public.processes p
  where p.critico and p.substituto_id is null and p.status <> 'arquivado';

  -- KPIs desatualizados: ultimo valor mais velho que a periodicidade
  insert into _alertas_atuais
  select 'kpi_desatualizado', 'atencao',
         'KPI desatualizado: ' || k.nome,
         case when u.ultima is null then 'Nenhum valor registrado ainda.'
              else 'Último valor de ' || to_char(u.ultima, 'DD/MM/YYYY') || '.' end,
         '/kpis/' || k.id, 'kpi', k.id, k.responsavel_id,
         'kpi_desatualizado:' || k.id || ':' || coalesce(u.ultima::text, 'nunca'), null
  from public.kpis k
  left join lateral (
    select max(v.referencia_periodo) as ultima from public.kpi_values v where v.kpi_id = k.id
  ) u on true
  where k.ativo
    and coalesce(u.ultima, k.criado_em::date) < current_date - case k.periodicidade
      when 'diaria' then 2 when 'semanal' then 9 when 'mensal' then 35 else 100 end;

  -- falhas de integracao (ultimos 7 dias), alerta geral
  insert into _alertas_atuais
  select 'falha_integracao', 'critico',
         'Falha de integração: ' || l.origem,
         left(coalesce(l.erro_detalhe, l.endpoint), 300),
         null, 'integration_log', l.id, null,
         'falha_integracao:' || l.id, null
  from public.integration_logs l
  where l.status = 'erro' and l.criado_em > now() - interval '7 days';

  insert into public.alerts (tipo, severidade, titulo, descricao, link, entidade, entidade_id, destinatario_id, chave, task_id, origem)
  select tipo, severidade, titulo, descricao, link, entidade, entidade_id, destinatario_id, chave, task_id, 'sistema'
  from _alertas_atuais
  where chave is not null
  on conflict (chave) do update
    set resolvido_em = null, destinatario_id = excluded.destinatario_id
    where public.alerts.resolvido_em is not null;
  get diagnostics v_novos = row_count;

  -- o que nao vale mais vira "resolvido" (nao some: rastreabilidade)
  update public.alerts a
  set resolvido_em = now()
  where a.origem = 'sistema'
    and a.resolvido_em is null
    and not exists (select 1 from _alertas_atuais x where x.chave = a.chave);

  return v_novos;
end;
$$;

revoke all on function public.gerar_alertas(boolean) from public;
grant execute on function public.gerar_alertas(boolean) to authenticated, service_role;
