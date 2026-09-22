-- Grupo R2Z OS — cor por evento do calendario do cliente, mesma
-- paleta fixa (CORES_TAREFA) e mesmo check constraint ja usados em
-- tasks.cor (migration 0008).

alter table public.calendar_events
  add column if not exists cor text check (
    cor in ('azul', 'verde', 'amarelo', 'laranja', 'vermelho', 'roxo', 'rosa', 'cinza')
  );
