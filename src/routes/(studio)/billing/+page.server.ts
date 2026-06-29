import type { PlanId } from '$lib/types/plans';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals, url }) => {
  const { profile } = (await parent()) as { profile?: { plan_id?: string } | null };
  const { user } = await locals.safeGetSession();
  const currentPlanId = (profile?.plan_id ?? 'free') as PlanId;

  let subscription = null;

  if (user) {
    const { data } = await locals.supabase
      .from('subscriptions')
      .select('status, cancel_at_period_end, current_period_end, plan_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    subscription = data;
  }

  return {
    currentPlanId,
    checkoutStatus: url.searchParams.get('checkout'),
    subscription
  };
};
