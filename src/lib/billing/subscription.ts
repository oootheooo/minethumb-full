import { env } from '$env/dynamic/public';
import { createSupabaseBrowserClient } from '$lib/supabase/client';

export type SubscriptionAction = 'cancel' | 'reactivate';

export type SubscriptionActionResult = {
  cancel_at_period_end: boolean;
  current_period_end: string | null;
};

export async function manageSubscription(action: SubscriptionAction) {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('You must be logged in to manage billing.');
  }

  const baseUrl = env.PUBLIC_SUPABASE_URL;
  const anonKey = env.PUBLIC_SUPABASE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    throw new Error('Supabase is not configured.');
  }

  const response = await fetch(`${baseUrl}/functions/v1/cancel-subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ action })
  });

  const payload = (await response.json()) as SubscriptionActionResult & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || 'Could not update subscription.');
  }

  return payload;
}
