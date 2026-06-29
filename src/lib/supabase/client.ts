import { env } from '$env/dynamic/public';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '$lib/types/database';

export const createSupabaseBrowserClient = () =>
  createBrowserClient<Database>(
    env.PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    env.PUBLIC_SUPABASE_ANON_KEY || 'missing-anon-key'
  );
