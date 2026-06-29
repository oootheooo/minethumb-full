import { fail, redirect } from '@sveltejs/kit';
import { isUsernameAvailable } from '$lib/profile/server';
import { validateProfileIdentity } from '$lib/profile/validation';

export const load = async ({ locals }) => {
  const { session } = await locals.safeGetSession();
  if (session) redirect(303, '/');
};

export const actions = {
  default: async ({ request, locals, url }) => {
    const form = await request.formData();
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');

    const validated = validateProfileIdentity({
      firstName: String(form.get('first_name') || ''),
      lastName: String(form.get('last_name') || ''),
      username: String(form.get('username') || '')
    });

    if (!validated.ok) {
      return fail(400, {
        message: validated.message,
        email,
        first_name: String(form.get('first_name') || ''),
        last_name: String(form.get('last_name') || ''),
        username: String(form.get('username') || '')
      });
    }

    if (!email) {
      return fail(400, {
        message: 'Email is required.',
        email,
        first_name: String(form.get('first_name') || ''),
        last_name: String(form.get('last_name') || ''),
        username: String(form.get('username') || '')
      });
    }

    if (password.length < 6) {
      return fail(400, {
        message: 'Password must be at least 6 characters.',
        email,
        first_name: validated.firstName,
        last_name: validated.lastName,
        username: validated.username
      });
    }

    const available = await isUsernameAvailable(validated.username);

    if (!available) {
      return fail(400, {
        message: 'That username is already taken.',
        email,
        first_name: validated.firstName,
        last_name: validated.lastName,
        username: validated.username
      });
    }

    const { error } = await locals.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${url.origin}/`,
        data: {
          first_name: validated.firstName,
          last_name: validated.lastName,
          username: validated.username
        }
      }
    });

    if (error) {
      return fail(400, {
        message: error.message,
        email,
        first_name: validated.firstName,
        last_name: validated.lastName,
        username: validated.username
      });
    }

    redirect(303, '/');
  }
};
