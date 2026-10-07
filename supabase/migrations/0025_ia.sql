-- Grupo R2Z OS — Grupo R2Z IA (Doc. 2 / Doc. 3 §7.3; Fase 2).
--
-- Estrutura pronta pra receber os relatorios que o n8n vai gerar
-- (integracao fica pra depois). Regras do Doc. 1 refletidas no modelo:
--   * fato, hipotese, problema e recomendacao ficam separados (tipo)
--   * a IA nao decide nada sozinha: todo achado nasce "pendente" e
--     precisa de validacao humana
--   * dados_insuficientes: a IA avisa quando nao tinha base
-- Escrita de relatorio/achado: so service_role (n8n). Pessoas validam,
-- comentam e relacionam achados a tarefas/KPIs/OKRs/processos.

create table if not exists public.ai_reports (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  periodo_inicio date not null,
  periodo_fim date not null,
  resumo text,
  -- ex: ["tasks", "kpis", "okrs"] ou objetos {fonte, registros, sincronizado_em}
  fontes jsonb not null default '[]'::jsonb,
  dados_insuficientes boolean not null default false,
  modelo text,
  origem text not null default 'n8n',
  chave_idempotencia text unique,
  gerado_em timestamptz not null default now()
);

create table if not exists public.ai_findings (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.ai_reports(id) on delete cascade,
  tipo text not null check (tipo in ('fato', 'hipotese', 'problema', 'recomendacao')),
  categoria text check (
    categoria in ('atrasos', 'retrabalho', 'indicadores', 'metas', 'processos', 'distribuicao', 'outro')
  ),
  prioridade text not null default 'media' check (prioridade in ('baixa', 'media', 'alta')),
  titulo text not null,
  descricao text,
  evidencias text,
  task_id uuid references public.tasks(id) on delete set null,
  kpi_id uuid references public.kpis(id) on delete set null,
  okr_id uuid references public.okrs(id) on delete set null,
  process_id uuid references public.processes(id) on delete set null,
  validacao text not null default 'pendente' check (validacao in ('pendente', 'validado', 'rejeitado')),
  validado_por uuid references public.profiles(id),
  validado_em timestamptz,
  criado_em timestamptz not null default now()
);

create table if not exists public.ai_finding_comments (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid not null references public.ai_findings(id) on delete cascade,
  autor_id uuid not null references public.profiles(id),
  texto text not null,
  criado_em timestamptz not null default now()
);

create index if not exists ai_reports_gerado_em_idx on public.ai_reports (gerado_em desc);
create index if not exists ai_findings_report_id_idx on public.ai_findings (report_id);
create index if not exists ai_findings_validacao_idx on public.ai_findings (validacao);
create index if not exists ai_finding_comments_finding_id_idx on public.ai_finding_comments (finding_id);

alter table public.ai_reports enable row level security;
alter table public.ai_findings enable row level security;
alter table public.ai_finding_comments enable row level security;

-- relatorios: gestores e admin leem (podem conter analise de
-- desempenho/distribuicao de tarefas -- informacao sensivel)
create policy "ai_reports: gestor ou administrador le"
  on public.ai_reports for select to authenticated using (public.is_gestor_ou_admin());

create policy "ai_findings: gestor ou administrador le"
  on public.ai_findings for select to authenticated using (public.is_gestor_ou_admin());

-- validar e relacionar: gestor/admin. O conteudo do achado (titulo,
-- descricao, tipo) nao muda -- o app so atualiza as colunas de
-- validacao/vinculo; a policy nao tem como restringir coluna, entao
-- isso e' garantido pela action.
create policy "ai_findings: gestor ou administrador valida"
  on public.ai_findings for update to authenticated
  using (public.is_gestor_ou_admin()) with check (public.is_gestor_ou_admin());

create policy "ai_finding_comments: gestor ou administrador le"
  on public.ai_finding_comments for select to authenticated using (public.is_gestor_ou_admin());

create policy "ai_finding_comments: gestor ou administrador comenta"
  on public.ai_finding_comments for insert to authenticated
  with check (autor_id = auth.uid() and public.is_gestor_ou_admin());

-- achado importante vira alerta (geral) assim que o relatorio chega
create or replace function public.alertar_achado_ia()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.prioridade = 'alta' and new.tipo in ('problema', 'recomendacao') then
    insert into public.alerts (tipo, severidade, titulo, descricao, link, entidade, entidade_id, chave, origem)
    values (
      'ia', 'atencao',
      'IA: ' || new.titulo,
      left(new.descricao, 300),
      '/ia/' || new.report_id,
      'ai_finding', new.id,
      'ia:' || new.id,
      'ia'
    )
    on conflict (chave) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists ai_findings_alerta on public.ai_findings;
create trigger ai_findings_alerta
  after insert on public.ai_findings
  for each row execute function public.alertar_achado_ia();
