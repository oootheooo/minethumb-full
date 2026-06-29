import { redirect } from '@sveltejs/kit';
import { loadStudioData } from '$lib/server/studio.server';

export const load = async ({ locals }) => {
  const { session, user } = await locals.safeGetSession();

  if (!session || !user) {
    return {
      session: null,
      user: null,
      profile: null,
      generations: [],
      generationsTotal: 0
    };
  }

  const { profile, generations, generationsTotal } = await loadStudioData(locals, user, session);

  return {
    session,
    user,
    profile,
    generations,
    generationsTotal
  };
};
