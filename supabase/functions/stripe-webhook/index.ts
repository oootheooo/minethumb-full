import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { json } from '../_shared/cors.ts';

const planFromPrice = (priceId: string | null) => {
  if (!priceId) return 'free';
  if (priceId === Deno.env.get('STRIPE_CREATOR_PRICE_ID')) return 'creator';
  if (priceId === Deno.env.get('STRIPE_PRO_PRICE_ID')) return 'pro';
  return 'free';
};

const creditsForPlan = (planId: string) => {
  if (planId === 'creator') return 60;
  if (planId === 'pro') return 30;
  return 2;
};

const syncSubscription = async (
  admin: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription,
  userId: string,
  resetCredits: boolean
) => {
  const priceId = subscription.items.data[0]?.price.id ?? null;
  const planId = planFromPrice(priceId);
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : null;

  const profileUpdate: Record<string, unknown> = {
    stripe_customer_id: customerId,
    plan_id: planId,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
  };

  if (resetCredits) {
    profileUpdate.credits_remaining = creditsForPlan(planId);
    profileUpdate.monthly_generation_limit = creditsForPlan(planId);
    profileUpdate.generations_this_period = 0;
  }

  await admin.from('profiles').update(profileUpdate).eq('id', userId);

  await admin.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      plan_id: planId,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end
    },
    { onConflict: 'stripe_subscription_id' }
  );
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-12-18.acacia' });
  const signature = req.headers.get('stripe-signature');
  const rawBody = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature!, Deno.env.get('STRIPE_WEBHOOK_SECRET')!);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Invalid signature' }, 400);
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated'
  ) {
    const object = event.data.object as Stripe.Checkout.Session | Stripe.Subscription;
    const subscriptionId =
      'subscription' in object && typeof object.subscription === 'string'
        ? object.subscription
        : 'id' in object
          ? object.id
          : null;

    const subscription = subscriptionId ? await stripe.subscriptions.retrieve(subscriptionId) : null;
    let userId = object.metadata?.user_id || subscription?.metadata?.user_id;

    if (!userId && subscription) {
      const { data: existing } = await admin
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .maybeSingle();
      userId = existing?.user_id;
    }

    if (userId && subscription) {
      let resetCredits = event.type !== 'customer.subscription.updated';

      if (event.type === 'customer.subscription.updated') {
        const { data: profile } = await admin.from('profiles').select('plan_id').eq('id', userId).single();
        const nextPlanId = planFromPrice(subscription.items.data[0]?.price.id ?? null);
        resetCredits = profile?.plan_id !== nextPlanId;
      }

      await syncSubscription(admin, subscription, userId, resetCredits);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const { data: existing } = await admin
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (existing?.user_id) {
      await admin
        .from('profiles')
        .update({
          plan_id: 'free',
          credits_remaining: 2,
          monthly_generation_limit: 2,
          current_period_start: null,
          current_period_end: null
        })
        .eq('id', existing.user_id);
      await admin.from('subscriptions').update({ status: 'deleted' }).eq('stripe_subscription_id', subscription.id);
    }
  }

  return json({ received: true });
});
