<script lang="ts">
  import { downloadGenerationImage, softDeleteGeneration } from '$lib/generation/api';
  import { portal } from '$lib/actions/portal';
  import type { Generation } from '$lib/types/generation';
  import Button from './Button.svelte';

  let {
    generation,
    onDeleted
  }: {
    generation: Generation | null;
    onDeleted?: (generationId: string) => void;
  } = $props();

  let deleting = $state(false);
  let confirmOpen = $state(false);
  let previewOpen = $state(false);

  const isPending = $derived(
    generation?.status === 'queued' || generation?.status === 'processing'
  );
  const isFailed = $derived(generation?.status === 'failed');
  const hasImage = $derived(Boolean(generation?.output_image_url || generation?.output_image_path));
  const canDownload = $derived(hasImage && !isFailed);

  const displaySize = $derived(
    (generation?.image_size || '1536x1024').replace(/x/i, '×')
  );

  const closeConfirm = () => {
    confirmOpen = false;
  };

  const closePreview = () => {
    previewOpen = false;
  };

  const openPreview = () => {
    if (canDownload) {
      previewOpen = true;
    }
  };

  $effect(() => {
    generation?.id;
    previewOpen = false;
  });

  $effect(() => {
    if (!previewOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  });

  const confirmDelete = async () => {
    if (!generation || deleting) return;

    deleting = true;
    try {
      await softDeleteGeneration(generation.id);
      confirmOpen = false;
      onDeleted?.(generation.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not delete generation.');
    } finally {
      deleting = false;
    }
  };

  const download = async () => {
    if (!generation || !canDownload) return;

    try {
      await downloadGenerationImage(generation);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not download image.');
    }
  };
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key !== 'Escape') return;
    if (previewOpen) {
      closePreview();
      return;
    }
    if (confirmOpen) {
      closeConfirm();
    }
  }}
/>

<aside class="viewer">
  {#if generation}
    <div class="image-shell">
      <button
        class="image"
        class:failed={isFailed}
        class:clickable={canDownload}
        type="button"
        disabled={!canDownload}
        aria-label={canDownload ? 'Open larger preview' : undefined}
        onclick={openPreview}
      >
        {#if hasImage}
          <img src={generation.output_image_url || generation.output_image_path || ''} alt="Selected thumbnail" />
        {:else if isPending}
          <div class="empty pending">
            <span class="shimmer" aria-hidden="true"></span>
            <p>Rendering thumbnail…</p>
          </div>
        {:else if isFailed}
          <div class="empty failed">
            <strong>Generation failed</strong>
            <span>{generation.error_message || 'Something went wrong during generation.'}</span>
          </div>
        {:else}
          <div class="empty">No preview available.</div>
        {/if}
      </button>

      {#if canDownload}
        <button
          class="image-action"
          type="button"
          aria-label="Download thumbnail"
          onclick={download}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 4v10m0 0l3.5-3.5M12 14l-3.5-3.5M5 18h14"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      {/if}
    </div>

    <div class="title-row">
      <h2>{generation.hook || 'Thumbnail draft'}</h2>
      <button
        class="icon-btn icon-btn--danger"
        type="button"
        aria-label="Delete thumbnail"
        disabled={deleting}
        onclick={() => (confirmOpen = true)}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12Z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <dl>
      <div><dt>Size</dt><dd>{displaySize}</dd></div>
      <div><dt>Created</dt><dd>{new Date(generation.created_at).toLocaleString()}</dd></div>
    </dl>
  {:else}
    <div class="empty">Select a generation to inspect the result.</div>
  {/if}
</aside>

{#if previewOpen && generation && canDownload}
  <div
    class="viewer-screen"
    use:portal
    role="dialog"
    aria-modal="true"
    aria-label="Thumbnail preview"
  >
    <button class="viewer-close" type="button" aria-label="Close preview" onclick={closePreview}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="m7 7 10 10M17 7 7 17"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
      </svg>
    </button>

    <div class="viewer-stage" role="presentation" onclick={closePreview}>
      <img
        class="viewer-image"
        src={generation.output_image_url || generation.output_image_path || ''}
        alt={generation.hook || 'Thumbnail preview'}
        onclick={(event) => event.stopPropagation()}
      />
    </div>

    <button
      class="image-action viewer-download-action"
      type="button"
      aria-label="Download thumbnail"
      onclick={(event) => {
        event.stopPropagation();
        void download();
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 4v10m0 0l3.5-3.5M12 14l-3.5-3.5M5 18h14"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
{/if}

{#if confirmOpen}
  <div class="modal-backdrop" use:portal role="presentation" onclick={closeConfirm}>
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
      onclick={(event) => event.stopPropagation()}
    >
      <p id="delete-confirm-title">Are you sure?</p>
      <div class="modal-actions">
        <Button size="sm" variant="secondary" disabled={deleting} onclick={closeConfirm}>No</Button>
        <Button size="sm" variant="danger" loading={deleting} disabled={deleting} onclick={confirmDelete}>
          Yes
        </Button>
      </div>
    </div>
  </div>
{/if}

<style>
  .viewer {
    display: grid;
    gap: var(--space-4);
    position: sticky;
    top: 1rem;
    align-self: start;
  }

  .image-shell {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
  }

  .image {
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-bg-muted);
    padding: 0;
    color: inherit;
    font: inherit;
    text-align: inherit;
  }

  .image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    border-radius: var(--radius-md);
  }

  .image > .empty {
    width: 100%;
    height: 100%;
    min-height: 0;
    box-sizing: border-box;
    border-radius: var(--radius-md);
  }

  .image.clickable {
    cursor: pointer;
  }

  .image.clickable:hover {
    border-color: rgba(255, 255, 255, 0.22);
  }

  .image:disabled {
    cursor: default;
  }

  .image.failed {
    border-color: rgba(239, 68, 68, 0.35);
  }

  .image-action {
    position: absolute;
    right: 0.65rem;
    bottom: 0.65rem;
    display: grid;
    place-items: center;
    width: 2.35rem;
    height: 2.35rem;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: var(--radius-sm);
    background: var(--color-bg-overlay);
    color: var(--color-text);
    cursor: pointer;
    transition:
      transform var(--transition-fast),
      background var(--transition-fast),
      border-color var(--transition-fast);
  }

  .image-action:hover {
    transform: translateY(-1px);
    background: var(--color-bg-raised);
    border-color: rgba(255, 255, 255, 0.24);
  }

  .image-action svg {
    width: 1.15rem;
    height: 1.15rem;
  }

  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  h2 {
    margin: 0;
    min-width: 0;
  }

  .icon-btn {
    display: grid;
    place-items: center;
    width: 2.2rem;
    height: 2.2rem;
    flex: 0 0 auto;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    transition:
      color var(--transition-fast),
      background var(--transition-fast),
      border-color var(--transition-fast);
  }

  .icon-btn--danger {
    color: #f87171;
  }

  .icon-btn--danger:hover:not(:disabled) {
    color: #fecaca;
    background: rgba(239, 68, 68, 0.12);
    border-color: rgba(239, 68, 68, 0.28);
  }

  .icon-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .icon-btn svg {
    width: 1.1rem;
    height: 1.1rem;
  }

  .empty {
    display: grid;
    place-items: center;
    gap: 0.35rem;
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    background: var(--color-bg-row);
    padding: 1rem;
    text-align: center;
  }

  .empty.pending {
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(135deg, rgba(56, 223, 248, 0.1), transparent),
      var(--color-bg-row);
  }

  .empty.pending .shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.09), transparent);
    animation: shimmer 1.4s infinite;
  }

  .empty.pending p {
    position: relative;
    z-index: 1;
    margin: 0;
    color: var(--color-text-muted);
  }

  @keyframes shimmer {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(100%);
    }
  }

  .empty.failed {
    border-color: rgba(239, 68, 68, 0.35);
    background: rgba(239, 68, 68, 0.08);
    color: #fecaca;
  }

  .empty.failed strong {
    display: block;
    font-weight: var(--font-weight-ui);
  }

  .empty.failed span {
    color: #fca5a5;
    font-size: var(--text-sm);
    line-height: 1.4;
  }

  dd {
    color: var(--color-text-muted);
  }

  dl {
    display: grid;
    gap: 0.65rem;
    margin: 0;
  }

  dl div {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0.55rem;
  }

  dt {
    color: var(--color-text-faint);
  }

  dd {
    margin: 0;
    text-align: right;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 110;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.62);
  }

  .modal {
    width: min(100%, 22rem);
    display: grid;
    gap: 1rem;
    border-radius: var(--radius-md);
    background: var(--color-surface-solid);
    box-shadow: var(--surface-shadow, 0 24px 64px rgba(0, 0, 0, 0.45));
    padding: 1.25rem;
  }

  .modal p {
    margin: 0;
    font-size: 1.05rem;
    font-weight: var(--font-weight-ui);
    text-align: center;
  }

  .modal-actions {
    display: flex;
    justify-content: center;
    gap: 0.65rem;
  }

  .viewer-screen {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    flex-direction: column;
    width: 100vw;
    height: 100dvh;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.96);
  }

  .viewer-stage {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 4.5rem 1.5rem 5.5rem;
    box-sizing: border-box;
  }

  .viewer-image {
    display: block;
    width: auto;
    height: auto;
    max-width: min(100%, calc(100vw - 3rem));
    max-height: min(100%, calc(100dvh - 10rem));
    object-fit: contain;
  }

  .viewer-close {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 2;
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: var(--radius-full);
    background: var(--color-bg-overlay);
    color: var(--color-text);
    cursor: pointer;
    transition:
      transform var(--transition-fast),
      background var(--transition-fast),
      border-color var(--transition-fast);
  }

  .viewer-close:hover {
    transform: translateY(-1px);
    background: var(--color-bg-overlay);
    border-color: rgba(255, 255, 255, 0.24);
  }

  .viewer-close svg {
    width: 1.1rem;
    height: 1.1rem;
  }

  .viewer-download-action {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    z-index: 2;
  }

  @media (max-width: 980px) {
    .viewer {
      position: static;
    }
  }
</style>
