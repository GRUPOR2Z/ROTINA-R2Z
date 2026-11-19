-- Grupo R2Z OS — responder_post (0030) foi criada antes da 0029 e nasceu
-- executavel por visitante sem login. Nao era um risco (para anon ela
-- sempre devolve "sem_acesso"), mas fica fechada como as demais.
-- Precisa ser colada no SQL Editor (o conector recusa revoke).
-- Funcoes novas ja nao nascem abertas (default privileges da 0029).

revoke execute on function public.responder_post(uuid, boolean, text) from public, anon;
grant execute on function public.responder_post(uuid, boolean, text) to authenticated;
