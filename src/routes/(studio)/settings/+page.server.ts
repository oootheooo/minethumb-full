import { fail } from '@sveltejs/kit';
import { isUsernameAvailable } from '$lib/profile/server';
import { validateProfileIdentity } from '$lib/profile/validation';

export const load = async ({ parent }) => {
  const { profile } = await parent();

  return {
    profile: {
      first_name: profile?.first_name ?? '',
      last_name: profile?.last_name ?? '',
      username: profile?.username ?? ''
    }
  };
};

export const actions = {
  default: async ({ request, locals }) => {
    const { session, user } = await locals.safeGetSession();

    if (!session || !user) {
      return fail(401, { message: 'You must be logged in to save settings.' });
    }

    const form = await request.formData();
    const validated = validateProfileIdentity({
      firstName: String(form.get('first_name') || ''),
      lastName: String(form.get('last_name') || ''),
      username: String(form.get('username') || '')
    });

    if (!validated.ok) {
      return fail(400, {
        message: validated.message,
        first_name: String(form.get('first_name') || ''),
        last_name: String(form.get('last_name') || ''),
        username: String(form.get('username') || '')
      });
    }

    const available = await isUsernameAvailable(validated.username, user.id);

    if (!available) {
      return fail(400, {
        message: 'That username is already taken.',
        first_name: validated.firstName,
        last_name: validated.lastName,
        username: validated.username
      });
    }

    const { error } = await locals.supabase
      .from('profiles')
      .update({
        first_name: validated.firstName,
        last_name: validated.lastName,
        username: validated.username
      })
      .eq('id', user.id);

    if (error) {
      return fail(400, {
        message: error.message || 'Could not save settings.',
        first_name: validated.firstName,
        last_name: validated.lastName,
        username: validated.username
      });
    }

    return {
      success: true,
      first_name: validated.firstName,
      last_name: validated.lastName,
      username: validated.username
    };
  }
};
