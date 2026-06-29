import type { Generation } from '$lib/types/generation';
import type { SupabaseClient } from '@supabase/supabase-js';

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

type AnySupabaseClient = SupabaseClient<any, 'public', any>;

export async function signedUrlForPath(supabase: AnySupabaseClient, path: string) {
  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  const { data: signed } = await supabase.storage
    .from('generated-thumbnails')
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  const url = signed?.signedUrl ?? null;
  if (url) {
    signedUrlCache.set(path, {
      url,
      expiresAt: Date.now() + (SIGNED_URL_TTL_SECONDS - 5 * 60) * 1000
    });
  }

  return url;
}

export async function attachSignedUrlToGeneration(
  supabase: AnySupabaseClient,
  row: Generation
): Promise<Generation> {
  if (!row.output_image_path || row.output_image_url) {
    return row;
  }

  return {
    ...row,
    output_image_url: await signedUrlForPath(supabase, row.output_image_path)
  };
}

export async function attachSignedUrlsToGenerations(
  supabase: AnySupabaseClient,
  rows: Generation[]
): Promise<Generation[]> {
  return Promise.all(rows.map((row) => attachSignedUrlToGeneration(supabase, row)));
}
