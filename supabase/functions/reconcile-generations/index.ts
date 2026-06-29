import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { reconcileGeneration } from '../_shared/responses-reconcile.ts';
import { corsHeaders, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const openaiKey = Deno.env.get('OPENAI_API_KEY');

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') || '' } }
  });
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user },
    error: userError
  } = await authClient.auth.getUser();

  if (userError || !user) return json({ error: 'Not authenticated' }, 401);
  if (!openaiKey) return json({ reconciled: 0 });

  const { data: pending, error: pendingError } = await admin
    .from('generations')
    .select('id, openai_response_id, credit_cost')
    .eq('user_id', user.id)
    .eq('status', 'processing')
    .not('openai_response_id', 'is', null)
    .order('created_at', { ascending: true })
    .limit(5);

  if (pendingError || !pending?.length) {
    return json({ reconciled: 0 });
  }

  let reconciled = 0;

  for (const generation of pending) {
    if (!generation.openai_response_id) continue;

    try {
      const done = await reconcileGeneration({
        admin,
        userId: user.id,
        generationId: generation.id,
        openaiResponseId: generation.openai_response_id,
        openaiKey,
        creditCost: generation.credit_cost
      });

      if (done) reconciled += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not reconcile generation.';
      await admin
        .from('generations')
        .update({ status: 'failed', error_message: message })
        .eq('id', generation.id)
        .eq('status', 'processing');
      reconciled += 1;
    }
  }

  return json({ reconciled });
});
