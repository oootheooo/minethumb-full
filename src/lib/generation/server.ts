import type { Generation } from '$lib/types/generation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { GENERATIONS_PAGE_SIZE } from './constants';
import { attachSignedUrlsToGenerations } from './signed-url';

type AnySupabaseClient = SupabaseClient<any, 'public', any>;

type LoadGenerationsOptions = {
  limit?: number;
  offset?: number;
};

export async function countGenerationsForUser(
  supabase: AnySupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('generations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('status', 'deleted');

  if (error || count == null) {
    return 0;
  }

  return count;
}

export async function loadGenerationsForUser(
  supabase: AnySupabaseClient,
  userId: string,
  options: LoadGenerationsOptions = {}
): Promise<Generation[]> {
  const limit = options.limit ?? GENERATIONS_PAGE_SIZE;
  const offset = options.offset ?? 0;

  const { data: rows, error } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !rows) {
    return [];
  }

  return attachSignedUrlsToGenerations(supabase, rows as Generation[]);
}
