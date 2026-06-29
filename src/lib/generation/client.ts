import { createSupabaseBrowserClient } from '$lib/supabase/client';
import type { Generation } from '$lib/types/generation';
import { GENERATIONS_PAGE_SIZE } from './constants';
import { attachSignedUrlsToGenerations } from './signed-url';

export async function fetchGenerationsPage(
  offset: number,
  limit = GENERATIONS_PAGE_SIZE
): Promise<Generation[]> {
  const supabase = createSupabaseBrowserClient();
  const { data: rows, error } = await supabase
    .from('generations')
    .select('*')
    .neq('status', 'deleted')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !rows) {
    return [];
  }

  return attachSignedUrlsToGenerations(supabase, rows as Generation[]);
}
