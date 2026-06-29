alter table public.generations
  add column if not exists openai_response_id text;

create index if not exists generations_openai_response_id_idx
  on public.generations (openai_response_id)
  where openai_response_id is not null;

create index if not exists generations_processing_user_idx
  on public.generations (user_id, created_at desc)
  where status in ('queued', 'processing');
