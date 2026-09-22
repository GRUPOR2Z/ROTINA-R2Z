-- Grupo R2Z OS — modulo de Clientes, Fase B: liga tarefa a cliente.
-- Nullable e "on delete set null" -- excluir o cliente nao apaga o
-- historico de tarefas, so desvincula (mesmo espirito de area_id em
-- tasks). RLS de tasks nao muda: transparencia operacional ja cobre
-- (interno ve tudo, tenha cliente ou nao).

alter table public.tasks
  add column if not exists client_id uuid references public.clients(id) on delete set null;

create index if not exists tasks_client_id_idx on public.tasks (client_id);
