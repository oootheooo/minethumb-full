import { createServerClient } from '@supabase/ssr';
import type { Cookies } from '@sveltejs/kit';
import type { Database } from '$lib/types/database';

export const createSupabaseServerClient = (url: string, anonKey: string, cookies: Cookies) =>
  createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (
        cookiesToSet: Array<{
          name: string;
          value: string;
          options: Parameters<typeof cookies.set>[2];
        }>
      ) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, { ...options, path: '/' });
        });
      }
    }
  });
