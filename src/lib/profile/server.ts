import { createAdminClient } from '$lib/generation/admin.server';
import { normalizeUsername } from '$lib/profile/validation';

export async function isUsernameAvailable(username: string, excludeUserId?: string) {
  const normalized = normalizeUsername(username);
  const admin = createAdminClient();

  if (!admin) {
    return false;
  }

  let query = admin.from('profiles').select('id').eq('username', normalized);

  if (excludeUserId) {
    query = query.neq('id', excludeUserId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    return false;
  }

  return !data;
}
