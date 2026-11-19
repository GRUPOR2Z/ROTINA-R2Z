-- Grupo R2Z OS — permissoes das funcoes (aviso de seguranca do Supabase).
--
-- Funcoes "security definer" nascem executaveis por qualquer um, inclusive
-- visitante sem login (papel anon), via /rest/v1/rpc/<funcao>. Nenhuma delas
-- vaza dados (respondem sim/nao ou ja checam o login), mas o certo e' fechar:
--   * funcoes de gatilho: ninguem chama direto (o gatilho dispara sozinho);
--   * funcoes usadas nas regras de acesso (RLS): so usuario logado;
--   * gerar_alertas: so usuario logado e o servidor (service_role).
--
-- ATENCAO: o conector do Supabase usado pelo Claude recusa "revoke". A
-- parte 1 foi aplicada pelo conector; a parte 2 precisa ser colada no
-- SQL Editor do Supabase (rodar o arquivo inteiro tambem funciona: tudo
-- e' idempotente).

-- parte 1 (aplicada pelo conector) -----------------------------------
alter function public.set_atualizado_em() set search_path = public;

-- parte 2 (SQL Editor) ------------------------------------------------
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.registrar_auditoria() from public, anon, authenticated;
revoke execute on function public.alertar_achado_ia() from public, anon, authenticated;
revoke execute on function public.atualizar_conclusao_onboarding() from public, anon, authenticated;

revoke execute on function
  public.is_admin(),
  public.is_gestor_ou_admin(),
  public.is_interno(),
  public.cliente_ve(uuid),
  public.cliente_ve_processo(uuid),
  public.pode_editar_projeto(uuid),
  public.pode_editar_reuniao(uuid),
  public.pode_marcar_onboarding(uuid),
  public.gerar_alertas(boolean)
from public, anon;

grant execute on function
  public.is_admin(),
  public.is_gestor_ou_admin(),
  public.is_interno(),
  public.cliente_ve(uuid),
  public.cliente_ve_processo(uuid),
  public.pode_editar_projeto(uuid),
  public.pode_editar_reuniao(uuid),
  public.pode_marcar_onboarding(uuid),
  public.gerar_alertas(boolean)
to authenticated, service_role;

revoke execute on function private.alertas_atuais() from public, anon, authenticated;

-- funcoes criadas daqui para frente tambem nao nascem abertas ao anon
alter default privileges for role postgres in schema public revoke execute on functions from public, anon;
