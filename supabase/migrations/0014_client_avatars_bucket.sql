-- Grupo R2Z OS — bucket de fotos de cliente (Fase A, pedido do Davi).
-- Publico pra leitura (mesma transparencia operacional do resto do
-- app, e a foto precisa aparecer pra um cliente externo tambem quando
-- a Fase D existir); upload/gestao so pra quem tem sessao interna.

insert into storage.buckets (id, name, public)
values ('client-avatars', 'client-avatars', true)
on conflict (id) do nothing;

create policy "client-avatars: leitura publica"
  on storage.objects for select
  using (bucket_id = 'client-avatars');

create policy "client-avatars: autenticado envia"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'client-avatars');

create policy "client-avatars: autenticado atualiza"
  on storage.objects for update to authenticated
  using (bucket_id = 'client-avatars')
  with check (bucket_id = 'client-avatars');

create policy "client-avatars: autenticado exclui"
  on storage.objects for delete to authenticated
  using (bucket_id = 'client-avatars');
