import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { corsHeaders, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const { planId } = await req.json();
  const priceId =
    planId === 'pro' ? Deno.env.get('STRIPE_PRO_PRICE_ID') : Deno.env.get('STRIPE_CREATOR_PRICE_ID');

  if (!['pro', 'creator'].includes(planId) || !priceId) {
    return json({ error: 'Invalid plan selected.' }, 400);
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

  const { data: profile } = await admin.from('profiles').select('stripe_customer_id,email').eq('id', user.id).single();
  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
    customerId = customer.id;
    await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/billing?checkout=success`,
    cancel_url: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/billing?checkout=cancelled`,
    metadata: { user_id: user.id, plan_id: planId },
    subscription_data: {
      metadata: { user_id: user.id, plan_id: planId }
    }
  });

  return json({ url: session.url });
});
