alter table public.profiles enable row level security;
alter table public.generations enable row level security;
alter table public.generation_assets enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credit_ledger enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update basic own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and plan_id = (select plan_id from public.profiles where id = auth.uid())
    and credits_remaining = (select credits_remaining from public.profiles where id = auth.uid())
    and monthly_generation_limit = (select monthly_generation_limit from public.profiles where id = auth.uid())
  );

create policy "Users can read own generations"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Users can delete own generations"
  on public.generations for delete
  using (auth.uid() = user_id);

create policy "Users can read own assets"
  on public.generation_assets for select
  using (auth.uid() = user_id);

create policy "Users can read own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can read own credit ledger"
  on public.credit_ledger for select
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('user-uploads', 'user-uploads', false, 10485760, array['image/png', 'image/jpeg', 'image/webp']),
  ('generated-thumbnails', 'generated-thumbnails', false, 20971520, array['image/png', 'image/jpeg', 'image/webp']),
  ('public-assets', 'public-assets', true, 20971520, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

create policy "Users can upload own files"
  on storage.objects for insert
  with check (
    bucket_id = 'user-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own uploads"
  on storage.objects for select
  using (
    bucket_id = 'user-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own generated thumbnails"
  on storage.objects for select
  using (
    bucket_id = 'generated-thumbnails'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
