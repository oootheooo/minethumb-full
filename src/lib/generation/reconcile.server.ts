import { env as publicEnv } from '$env/dynamic/public';

export async function reconcilePendingGenerations(accessToken: string) {
  const baseUrl = publicEnv.PUBLIC_SUPABASE_URL;
  if (!baseUrl) return;

  try {
    await fetch(`${baseUrl}/functions/v1/reconcile-generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: '{}'
    });
  } catch {
    // Best-effort; the next poll will retry.
  }
}
