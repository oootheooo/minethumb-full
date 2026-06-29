import { redirect } from '@sveltejs/kit';

export const load = async ({ url }) => {
  const suffix = url.pathname.replace(/^\/app\/?/, '');
  redirect(303, suffix ? `/${suffix}` : '/');
};
