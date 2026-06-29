import { markStaleGenerations } from '$lib/generation/admin.server';
import { reconcilePendingGenerations } from '$lib/generation/reconcile.server';
import { countGenerationsForUser, loadGenerationsForUser } from '$lib/generation/server';
import { GENERATIONS_PAGE_SIZE } from '$lib/generation/constants';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

type StudioLocals = {
  supabase: SupabaseClient;
};

export const loadStudioData = async (
  locals: StudioLocals,
  user: User,
  session: Session
) => {
  await markStaleGenerations(user.id);

  const { count: pendingCount } = await locals.supabase
    .from('generations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'processing')
    .not('openai_response_id', 'is', null);

  if (pendingCount && pendingCount > 0) {
    await reconcilePendingGenerations(session.access_token);
  }

  const [{ data: profile }, generations, generationsTotal] = await Promise.all([
    locals.supabase.from('profiles').select('*').eq('id', user.id).single(),
    loadGenerationsForUser(locals.supabase, user.id, {
      limit: GENERATIONS_PAGE_SIZE,
      offset: 0
    }),
    countGenerationsForUser(locals.supabase, user.id)
  ]);

  return { profile, generations, generationsTotal };
};
