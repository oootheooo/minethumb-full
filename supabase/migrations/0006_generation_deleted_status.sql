alter table public.generations drop constraint if exists generations_status_check;

alter table public.generations
  add constraint generations_status_check
  check (status in ('queued', 'processing', 'completed', 'failed', 'deleted'));

create policy "Users can soft delete own generations"
  on public.generations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and status = 'deleted');

-- Stale in-flight rows (e.g. interrupted requests) should not stay "processing" forever
update public.generations
set
  status = 'failed',
  error_message = coalesce(error_message, 'Generation did not complete.')
where status in ('queued', 'processing')
  and output_image_path is null
  and created_at < now() - interval '15 minutes';
