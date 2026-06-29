import { env } from '$env/dynamic/public';
import { createSupabaseBrowserClient } from '$lib/supabase/client';
import type { PlanId } from '$lib/types/plans';

export async function startCheckoutSession(planId: Extract<PlanId, 'pro' | 'creator'>) {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('You must be logged in to upgrade.');
  }

  const baseUrl = env.PUBLIC_SUPABASE_URL;
  const anonKey = env.PUBLIC_SUPABASE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    throw new Error('Supabase is not configured.');
  }

  const response = await fetch(`${baseUrl}/functions/v1/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ planId })
  });

  const payload = (await response.json()) as { url?: string; error?: string };

  if (!response.ok) {
    throw new Error(payload.error || 'Could not start checkout.');
  }

  if (!payload.url) {
    throw new Error('Checkout URL missing from server response.');
  }

  window.location.href = payload.url;
}
