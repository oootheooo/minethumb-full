import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
  const { session } = await locals.safeGetSession();
  if (session) redirect(303, '/');
};

export const actions = {
  default: async ({ request, locals }) => {
    const form = await request.formData();
    const email = String(form.get('email') || '');
    const password = String(form.get('password') || '');

    const { error } = await locals.supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return fail(400, { message: error.message, email });
    }

    redirect(303, '/');
  }
};
