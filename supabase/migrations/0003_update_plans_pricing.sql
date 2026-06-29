update public.plans
set
  price_cents = 0,
  monthly_generation_limit = 1,
  credits_included = 1
where id = 'free';

update public.plans
set
  price_cents = 599,
  monthly_generation_limit = 30,
  credits_included = 30
where id = 'pro';

update public.plans
set
  price_cents = 999,
  monthly_generation_limit = 60,
  credits_included = 60
where id = 'creator';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, credits_remaining, monthly_generation_limit, current_period_start, current_period_end)
  values (new.id, new.email, 1, 1, now(), now() + interval '1 month');
  insert into public.credit_ledger (user_id, amount, reason)
  values (new.id, 1, 'signup_grant');
  return new;
end;
$$;
