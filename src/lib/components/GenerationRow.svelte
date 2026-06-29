<script lang="ts">
  import type { Generation } from '$lib/types/generation';

  let {
    generation,
    selected = false,
    onSelect
  }: { generation: Generation; selected?: boolean; onSelect?: () => void } = $props();

  const statusLabel = $derived(generation.status[0].toUpperCase() + generation.status.slice(1));
  const isPending = $derived(generation.status === 'queued' || generation.status === 'processing');
  const isFailed = $derived(generation.status === 'failed');
</script>

<button class="row" class:selected onclick={onSelect} type="button">
  <div class="preview" class:failed={isFailed}>
    {#if generation.output_image_url || generation.output_image_path}
      <img src={generation.output_image_url || generation.output_image_path || ''} alt="" />
    {:else if isPending}
      <span class="shimmer"></span>
    {:else if isFailed}
      <span class="failed-icon">!</span>
    {:else}
      <span class="placeholder"></span>
    {/if}
  </div>
  <div class="content">
    <strong>{generation.hook || 'Thumbnail draft'}</strong>
  </div>
  <span class="status {generation.status}">{statusLabel}</span>
  <span class="chevron">›</span>
</button>

<style>
  .row {
    display: grid;
    grid-template-columns: 4.5rem minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 0.65rem;
    width: 100%;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-row);
    color: inherit;
    padding: 0.45rem 0.55rem;
    text-align: left;
    transition:
      border-color var(--transition-fast),
      transform var(--transition-fast),
      background var(--transition-fast);
  }

  .row:hover {
    transform: translateY(-1px);
    background: var(--color-bg-row-hover);
  }

  .selected {
    border-color: rgba(239, 29, 29, 0.48);
    background: var(--color-bg-row-selected);
  }

  .preview,
  .preview img {
    aspect-ratio: 16 / 9;
    border-radius: var(--radius-sm);
  }

  .preview {
    overflow: hidden;
    background: var(--color-bg-muted);
    display: grid;
    place-items: center;
  }

  .preview.failed {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
  }

  .preview img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  .shimmer {
    display: block;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.09), transparent);
    animation: shimmer 1.4s infinite;
  }

  .placeholder {
    display: block;
    width: 100%;
    height: 100%;
    background: var(--color-bg-muted);
  }

  .failed-icon {
    color: #fecaca;
    font-size: 1.4rem;
    font-weight: var(--font-weight-ui);
  }

  strong {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.92rem;
    font-weight: var(--font-weight-ui);
  }

  .status {
    color: var(--color-text-muted);
    font-size: var(--text-xs);
    font-weight: var(--font-weight-ui);
    white-space: nowrap;
  }

  .completed {
    color: var(--color-text-muted);
  }

  .failed {
    color: #f87171;
  }

  .processing,
  .queued {
    color: var(--color-gold);
  }

  .chevron {
    color: var(--color-text-faint);
    font-size: 1.6rem;
  }

  @keyframes shimmer {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(100%);
    }
  }

  @media (max-width: 640px) {
    .row {
      grid-template-columns: 4rem minmax(0, 1fr);
    }

    .status,
    .chevron {
      display: none;
    }
  }
</style>
