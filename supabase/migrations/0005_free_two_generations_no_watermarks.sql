update public.plans
set
  monthly_generation_limit = 2,
  credits_included = 2,
  watermark = false
where id = 'free';

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
