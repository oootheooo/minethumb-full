<script lang="ts">
  import { page } from '$app/state';
  import BackLink from '$lib/components/BackLink.svelte';
  import Logo from '$lib/components/Logo.svelte';
  import UserMenu from '$lib/components/UserMenu.svelte';
  import { GENERATIONS_KEY, type GenerationsContext } from '$lib/generation/context';
  import { fetchGenerationsPage } from '$lib/generation/client';
  import { attachSignedUrlToGeneration } from '$lib/generation/signed-url';
  import { createSupabaseBrowserClient } from '$lib/supabase/client';
  import type { Generation } from '$lib/types/generation';
  import { setContext, type Snippet } from 'svelte';

  type StudioShellData = {
    user?: { id?: string; email?: string | null } | null;
    profile?: {
      credits_remaining?: number;
      plan_id?: string;
      username?: string | null;
    } | null;
    generations?: Generation[];
    generationsTotal?: number;
  };

  let { children, data }: { children: Snippet; data: StudioShellData } = $props();

  const showBack = $derived(page.url.pathname !== '/');

  let generations = $state<Generation[]>([]);
  let generationsTotal = $state(0);
  let loadingMore = $state(false);

  $effect(() => {
    generations = data.generations ?? [];
    generationsTotal = data.generationsTotal ?? data.generations?.length ?? 0;
  });

  const hasMore = $derived(generations.length < generationsTotal);

  const attachSignedUrl = async (row: Generation): Promise<Generation> => {
    if (!row.output_image_path || row.output_image_url) return row;

    const supabase = createSupabaseBrowserClient();
    return attachSignedUrlToGeneration(supabase, row);
  };

  const removeById = (generationId: string) => {
    const hadRow = generations.some((item) => item.id === generationId);
    generations = generations.filter((item) => item.id !== generationId);
    if (hadRow) {
      generationsTotal = Math.max(0, generationsTotal - 1);
    }
  };

  const applyRow = async (row: Generation) => {
    if (row.status === 'deleted') {
      removeById(row.id);
      return;
    }

    const next = await attachSignedUrl(row);
    const index = generations.findIndex((item) => item.id === next.id);

    if (index >= 0) {
      generations = generations.map((item, i) => (i === index ? { ...item, ...next } : item));
      return;
    }

    generations = [next, ...generations];
    generationsTotal += 1;
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    loadingMore = true;
    try {
      const page = await fetchGenerationsPage(generations.length);
      if (page.length === 0) {
        generationsTotal = generations.length;
        return;
      }

      const existingIds = new Set(generations.map((item) => item.id));
      const appended = page.filter((item) => !existingIds.has(item.id));
      generations = [...generations, ...appended];
    } finally {
      loadingMore = false;
    }
  };

  const generationsContext: GenerationsContext = {
    get current() {
      return generations;
    },
    get totalCount() {
      return generationsTotal;
    },
    get hasMore() {
      return hasMore;
    },
    get loadingMore() {
      return loadingMore;
    },
    replace(next) {
      generations = next;
    },
    applyRow,
    removeById,
    loadMore
  };

  setContext(GENERATIONS_KEY, generationsContext);

  $effect(() => {
    const userId = data.user?.id;
    if (!userId) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`generations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generations',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            void applyRow(payload.new as Generation);
            return;
          }

          if (payload.eventType === 'DELETE') {
            removeById(payload.old.id as string);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  });
</script>

<div class="shell">
  <header class="studio-header">
    <Logo />
    <UserMenu
      email={data.user?.email}
      username={data.profile?.username}
      planId={data.profile?.plan_id}
      credits={data.profile?.credits_remaining ?? 2}
    />
  </header>

  <main>
    {#if showBack}
      <div class="studio-back">
        <BackLink href="/" label="Back to home" />
      </div>
    {/if}
    {@render children()}
  </main>
</div>

<style>
  .shell {
    position: relative;
    min-height: 100dvh;
    padding: clamp(4.5rem, 8vw, 5rem) 1rem 1.5rem;
  }

  .studio-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-bg-app);
    border-bottom: 1px solid var(--color-border);
    pointer-events: none;
  }

  .studio-header :global(.logo),
  .studio-header :global(.user-menu) {
    pointer-events: auto;
  }

  main {
    width: min(100%, var(--container-2xl, 1440px));
    margin-inline: auto;
    min-width: 0;
  }

  .studio-back {
    width: min(56rem, 100%);
    margin: 0 auto var(--space-4);
  }

  @media (max-width: 640px) {
    .studio-header {
      align-items: center;
      flex-direction: row;
    }
  }
</style>
