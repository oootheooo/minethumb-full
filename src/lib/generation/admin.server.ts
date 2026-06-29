import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { createClient } from '@supabase/supabase-js';

const STALE_MS = 4 * 60 * 1000;

export function createAdminClient() {
  const url = publicEnv.PUBLIC_SUPABASE_URL;
  const key = privateEnv.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

export async function markStaleGenerations(userId: string) {
  const admin = createAdminClient();
  if (!admin) return;

  const cutoff = new Date(Date.now() - STALE_MS).toISOString();

  await admin
    .from('generations')
    .update({
      status: 'failed',
      error_message: 'Generation timed out before completing. Your credit was not used.'
    })
    .eq('user_id', userId)
    .in('status', ['queued', 'processing'])
    .is('output_image_path', null)
    .lt('created_at', cutoff);
}
