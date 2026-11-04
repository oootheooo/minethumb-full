alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists username text;

alter table public.profiles
  add constraint profiles_username_format_check
  check (username is null or username ~ '^[a-z0-9_]{3,30}$');

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username))
  where username is not null;

create or replace function public.is_username_available(check_username text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (
    select 1
    from public.profiles
    where lower(username) = lower(trim(check_username))
  );
$$;

grant execute on function public.is_username_available(text) to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  signup_username text := nullif(lower(trim(meta->>'username')), '');
begin
  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    username,
    credits_remaining,
    monthly_generation_limit,
    current_period_start,
    current_period_end
  )
  values (
    new.id,
    new.email,
    nullif(trim(meta->>'first_name'), ''),
    nullif(trim(meta->>'last_name'), ''),
    signup_username,
    2,
    2,
    now(),
    now() + interval '1 month'
  );

  insert into public.credit_ledger (user_id, amount, reason)
  values (new.id, 2, 'signup_grant');

  return new;
end;
$$;
