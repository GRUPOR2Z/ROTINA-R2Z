-- Grupo R2Z OS — permite alternar "visivel ao cliente" num vinculo
-- processo-cliente (aba Processos do cliente). A 0018 so criou policies
-- de leitura, insercao e exclusao. A policy restritiva da 0026 continua
-- barrando usuarios "cliente".

create policy "process_clients: qualquer autenticado altera visibilidade"
  on public.process_clients for update to authenticated
  using (true) with check (true);
