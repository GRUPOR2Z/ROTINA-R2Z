-- Simplificacao pedida pelo Davi: em vez de direcao + 2 limiares
-- manuais, o KPI guarda valor_inicial e meta (ex: "de 2 pra 4") e o
-- farol e' calculado pela distancia percorrida entre os dois.

alter table public.kpis
  add column if not exists valor_inicial numeric,
  add column if not exists tipo_meta text not null default 'unidade' check (tipo_meta in ('percentual', 'unidade'));

alter table public.kpis
  drop column if exists direcao,
  drop column if exists limiar_atencao,
  drop column if exists limiar_critico;
