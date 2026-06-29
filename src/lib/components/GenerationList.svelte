<script lang="ts">
  import { GENERATIONS_PAGE_SIZE } from '$lib/generation/constants';
  import { getGenerationsContext } from '$lib/generation/context';
  import type { Generation } from '$lib/types/generation';
  import GenerationRow from './GenerationRow.svelte';

  let {
    selectedId,
    onSelect
  }: {
    selectedId?: string;
    onSelect: (generation: Generation) => void;
  } = $props();

  const generationsContext = getGenerationsContext();
  const generations = $derived(generationsContext.current);
  const totalCount = $derived(generationsContext.totalCount);
  const hasMore = $derived(generationsContext.hasMore);
  const loadingMore = $derived(generationsContext.loadingMore);

  let rowsEl = $state<HTMLElement | null>(null);
  let sentinel = $state<HTMLElement | null>(null);
  let scrollMaxHeight = $state<string | null>(null);

  const needsScroll = $derived(
    generations.length > GENERATIONS_PAGE_SIZE ||
      (hasMore && generations.length >= GENERATIONS_PAGE_SIZE)
  );

  const syncScrollHeight = () => {
    const container = rowsEl;
    if (!container || generations.length === 0) {
      scrollMaxHeight = null;
      return;
    }

    const row = container.querySelector<HTMLElement>('.row');
    if (!row) return;

    const style = getComputedStyle(container);
    const gap = Number.parseFloat(style.rowGap || style.gap || '0') || 0;
    const viewportRows = needsScroll
      ? GENERATIONS_PAGE_SIZE - 0.5
      : Math.min(generations.length, GENERATIONS_PAGE_SIZE);
    const maxHeight = row.offsetHeight * viewportRows + gap * Math.max(viewportRows - 1, 0);
    scrollMaxHeight = `${maxHeight}px`;
  };

  $effect(() => {
    generations.length;
    hasMore;
    selectedId;
    queueMicrotask(syncScrollHeight);
  });

  $effect(() => {
    const node = sentinel;
    const root = rowsEl;
    if (!node || !hasMore || !root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void generationsContext.loadMore();
        }
      },
      { root, rootMargin: '48px', threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  });
</script>

<section class="list">
  <div class="head">
    <h2>My thumbnails</h2>
    <span>{totalCount}</span>
  </div>

  <div
    class="rows"
    class:rows--scrollable={needsScroll}
    bind:this={rowsEl}
    style:max-height={scrollMaxHeight ?? undefined}
  >
    {#if totalCount === 0}
      <p class="empty">No thumbnails yet. Generate your first one above.</p>
    {:else}
      {#each generations as generation (generation.id)}
        <GenerationRow
          {generation}
          selected={selectedId === generation.id}
          onSelect={() => onSelect(generation)}
        />
      {/each}

      {#if hasMore}
        <div class="sentinel" bind:this={sentinel} aria-hidden="true"></div>
        {#if loadingMore}
          <p class="loading-more">Loading more…</p>
        {/if}
      {/if}
    {/if}
  </div>
</section>

<style>
  .list {
    display: grid;
    gap: 0.8rem;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  h2 {
    margin: 0;
    font-size: 1.05rem;
  }

  .head span {
    color: var(--color-text-muted);
  }

  .rows {
    display: grid;
    gap: 0.65rem;
    min-height: 0;
  }

  .rows--scrollable {
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding-right: 0.15rem;
  }

  .sentinel {
    height: 1px;
  }

  .loading-more {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    text-align: center;
  }

  .empty {
    margin: 0;
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    padding: 1rem;
    text-align: center;
  }
</style>
