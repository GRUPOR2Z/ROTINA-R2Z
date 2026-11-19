-- Grupo R2Z OS — roteiro do post no calendario de conteudo.
-- Nao aparece na grade do calendario: so quando alguem clica no post
-- (equipe e cliente). O cliente continua so lendo (RLS da 0026).

alter table public.calendar_events
  add column if not exists roteiro text;
