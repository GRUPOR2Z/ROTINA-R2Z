-- Adiciona horario opcional as tarefas -- quando definido, aparece
-- como evento com hora (tipo "09:00 Agenda"); quando ausente, aparece
-- como item de dia inteiro, igual a um feriado no Google Agenda.

alter table public.tasks
  add column if not exists horario time;
