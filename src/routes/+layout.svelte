<script lang="ts">
  import { page } from '$app/state';
  import '$lib/styles/global.css';
  import AppStudioShell from '$lib/components/AppStudioShell.svelte';
  import { isStudioPath } from '$lib/studio/routes';
  import type { Generation } from '$lib/types/generation';
  import type { Snippet } from 'svelte';

  type LayoutData = {
    session?: { access_token: string } | null;
    user?: { id?: string; email?: string | null } | null;
    profile?: { credits_remaining?: number; plan_id?: string } | null;
    generations?: Generation[];
    generationsTotal?: number;
  };

  let { children, data }: { children: Snippet; data: LayoutData } = $props();

  const showStudio = $derived(Boolean(data.session) && isStudioPath(page.url.pathname));
</script>

{#if showStudio}
  <AppStudioShell {data}>
    {@render children()}
  </AppStudioShell>
{:else}
  {@render children()}
{/if}
