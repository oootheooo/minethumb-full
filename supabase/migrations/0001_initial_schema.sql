create extension if not exists pgcrypto;

create table public.plans (
  id text primary key,
  name text not null,
  price_cents int not null default 0,
  monthly_generation_limit int not null,
  credits_included int not null,
  watermark boolean not null default false,
  priority_generation boolean not null default false,
  active boolean not null default true,
  stripe_price_id text,
  created_at timestamptz not null default now()
);

insert into public.plans
  (id, name, price_cents, monthly_generation_limit, credits_included, watermark, priority_generation)
values
  ('free', 'Free', 0, 2, 2, false, false),
  ('pro', 'Pro', 1399, 30, 30, false, false),
  ('creator', 'Creator', 2099, 60, 60, false, true)
on conflict (id) do nothing;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  stripe_customer_id text,
  plan_id text not null default 'free' references public.plans(id),
  credits_remaining int not null default 2,
  monthly_generation_limit int not null default 2,
  generations_this_period int not null default 0,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  video_description text not null check (char_length(video_description) <= 500),
  hook text,
  prompt text,
  output_image_path text,
  model text,
  image_size text,
  error_message text,
  credit_cost int not null default 1,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index generations_user_created_idx on public.generations(user_id, created_at desc);

create table public.generation_assets (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid references public.generations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_type text not null check (
    asset_type in ('minecraft_skin', 'face_photo', 'game_screenshot', 'generated_output')
  ),
  storage_bucket text not null,
  storage_path text not null,
  content_type text,
  created_at timestamptz not null default now()
);

create index generation_assets_generation_idx on public.generation_assets(generation_id);
create index generation_assets_user_idx on public.generation_assets(user_id);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan_id text references public.plans(id),
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id uuid references public.generations(id) on delete set null,
  amount int not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, credits_remaining, monthly_generation_limit, current_period_start, current_period_end)
  values (new.id, new.email, 2, 2, now(), now() + interval '1 month');
  insert into public.credit_ledger (user_id, amount, reason)
  values (new.id, 2, 'signup_grant');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();

create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute procedure public.touch_updated_at();
