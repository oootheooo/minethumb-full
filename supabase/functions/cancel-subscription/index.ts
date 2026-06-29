import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { corsHeaders, json } from '../_shared/cors.ts';

const activeStatuses = ['active', 'trialing', 'past_due'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let action: 'cancel' | 'reactivate' = 'cancel';

  try {
    const body = await req.json();
    if (body?.action === 'reactivate') action = 'reactivate';
  } catch {
    // Empty body defaults to cancel.
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') || '' } }
  });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-12-18.acacia' });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Not authenticated' }, 401);

  const { data: profile } = await admin
    .from('profiles')
    .select('plan_id,stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile || profile.plan_id === 'free') {
    return json({ error: 'No paid subscription to manage.' }, 400);
  }

  let subscriptionRow = (
    await admin
      .from('subscriptions')
      .select('stripe_subscription_id,status,cancel_at_period_end,current_period_end')
      .eq('user_id', user.id)
      .in('status', activeStatuses)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ).data;

  let stripeSubscriptionId = subscriptionRow?.stripe_subscription_id ?? null;

  if (!stripeSubscriptionId && profile.stripe_customer_id) {
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'all',
      limit: 10
    });

    const activeSubscription = stripeSubscriptions.data.find((item) => activeStatuses.includes(item.status));
    stripeSubscriptionId = activeSubscription?.id ?? null;
  }

  if (!stripeSubscriptionId) {
    return json({ error: 'No active subscription found.' }, 404);
  }

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  if (!activeStatuses.includes(subscription.status)) {
    return json({ error: 'Subscription is not active.' }, 400);
  }

  if (action === 'cancel') {
    if (subscription.cancel_at_period_end) {
      return json({
        cancel_at_period_end: true,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      });
    }

    const updated = await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true });

    await admin
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        status: updated.status,
        current_period_end: new Date(updated.current_period_end * 1000).toISOString()
      })
      .eq('stripe_subscription_id', updated.id);

    return json({
      cancel_at_period_end: true,
      current_period_end: new Date(updated.current_period_end * 1000).toISOString()
    });
  }

  if (!subscription.cancel_at_period_end) {
    return json({
      cancel_at_period_end: false,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
    });
  }

  const updated = await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: false });

  await admin
    .from('subscriptions')
    .update({
      cancel_at_period_end: false,
      status: updated.status,
      current_period_end: new Date(updated.current_period_end * 1000).toISOString()
    })
    .eq('stripe_subscription_id', updated.id);

  return json({
    cancel_at_period_end: false,
    current_period_end: new Date(updated.current_period_end * 1000).toISOString()
  });
});
