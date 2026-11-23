-- Grupo R2Z OS — PDF tambem na aba Processos do cliente.
--
-- Os PDFs de processo ficam em client-files/<cliente>/processos/<arquivo>.pdf
-- e os de roteiro continuam em client-files/<cliente>/<arquivo>.pdf. As regras
-- do bucket passam a conferir a permissao da area certa pelo caminho:
-- pasta "processos" -> permissao em Processos; o resto -> Roteiros.

create or replace function public.modulo_do_arquivo(p_caminho text)
returns text
language sql
immutable
set search_path = public
as $$
  select case when (storage.foldername(p_caminho))[2] = 'processos' then 'processos' else 'roteiros' end;
$$;

grant execute on function public.modulo_do_arquivo(text) to authenticated;

alter policy "client-files: equipe le tudo, cliente le a propria pasta" on storage.objects
  using (
    bucket_id = 'client-files'
    and (
      (select public.is_interno())
      or public.cliente_pode(public.uuid_ou_nulo((storage.foldername(name))[1]), public.modulo_do_arquivo(name), 'ver')
    )
  );

alter policy "portal: upload so equipe interna" on storage.objects
  with check (
    (select public.is_interno())
    or (
      bucket_id = 'client-files'
      and public.cliente_pode(public.uuid_ou_nulo((storage.foldername(name))[1]), public.modulo_do_arquivo(name), 'criar')
    )
  );

alter policy "client-files: cliente com permissao envia" on storage.objects
  with check (
    bucket_id = 'client-files'
    and public.cliente_pode(public.uuid_ou_nulo((storage.foldername(name))[1]), public.modulo_do_arquivo(name), 'criar')
  );
