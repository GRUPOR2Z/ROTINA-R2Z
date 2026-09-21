alter table public.tasks
  add column if not exists cor text check (
    cor in ('azul', 'verde', 'amarelo', 'laranja', 'vermelho', 'roxo', 'rosa', 'cinza')
  );
