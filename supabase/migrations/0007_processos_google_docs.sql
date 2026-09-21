alter table public.processes
  add column if not exists google_doc_url text;
