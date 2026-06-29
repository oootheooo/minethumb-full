<script lang="ts">
  import GenerationComposer from '$lib/components/GenerationComposer.svelte';
  import GenerationList from '$lib/components/GenerationList.svelte';
  import ResultViewer from '$lib/components/ResultViewer.svelte';
  import { getGenerationsContext } from '$lib/generation/context';
  import type { Generation } from '$lib/types/generation';

  const generationsContext = getGenerationsContext();
  const generations = $derived(generationsContext.current);

  let selected = $state<Generation | null>(null);
  let closing = $state(false);
  let closeTimer: number | null = null;
  let composerAnchor = $state<HTMLElement | null>(null);

  const OUTPUT_EXIT_MS = 120;
  const PANEL_COLLAPSE_MS = 120;
  const STAGGER_MS = 0;
  const CLOSE_TOTAL_MS = STAGGER_MS + PANEL_COLLAPSE_MS;

  const clearCloseTimer = () => {
    if (!closeTimer) return;
    window.clearTimeout(closeTimer);
    closeTimer = null;
  };

  $effect(() => {
    const current = selected;
    if (!current) return;

    const latest = generations.find((generation) => generation.id === current.id);
    if (!latest || latest === current) return;

    if (
      latest.status !== current.status ||
      latest.output_image_url !== current.output_image_url ||
      latest.output_image_path !== current.output_image_path ||
      latest.error_message !== current.error_message
    ) {
      selected = latest;
    }
  });

  const scrollComposerIntoView = () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    composerAnchor?.scrollIntoView({
      behavior: 'auto',
      block: 'start'
    });
  };

  const selectGeneration = (generation: Generation) => {
    clearCloseTimer();
    closing = false;
    selected = generation;
    requestAnimationFrame(scrollComposerIntoView);
  };

  const handleGenerationCreated = (generation: Generation) => {
    clearCloseTimer();
    closing = false;
    void generationsContext.applyRow(generation);
    selected = generation;
  };

  const handleDeleted = async (generationId: string) => {
    if (selected?.id === generationId) {
      selected = null;
      closing = false;
    }
    generationsContext.removeById(generationId);
  };

  const deselect = () => {
    if (!selected || closing) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      selected = null;
      closing = false;
      return;
    }

    closing = true;
    closeTimer = window.setTimeout(() => {
      selected = null;
      closing = false;
      closeTimer = null;
    }, CLOSE_TOTAL_MS);
  };
</script>

<div class="split-shell" class:split-shell--open={!!selected}>
  {#if selected}
    <button
      type="button"
      class="split-hit split-hit--side split-hit--left"
      aria-label="Close preview"
      disabled={closing}
      onclick={deselect}
    ></button>
  {/if}

<div
  class="panel"
  class:panel--selected={!!selected}
  class:panel--closing={closing}
  style:--panel-collapse-ms="{PANEL_COLLAPSE_MS}ms"
  style:--output-exit-ms="{OUTPUT_EXIT_MS}ms"
  style:--stagger-ms="{STAGGER_MS}ms"
>
  <div class="main-column" bind:this={composerAnchor}>
    <GenerationComposer
      selected={selected}
      onCreated={handleGenerationCreated}
      onDeselect={deselect}
    />
    <GenerationList selectedId={selected?.id} onSelect={selectGeneration} />
  </div>

  {#if selected}
    <div class="output" class:output--closing={closing}>
      <button
        type="button"
        class="split-close"
        aria-label="Close preview"
        disabled={closing}
        onclick={deselect}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>
      <ResultViewer generation={selected} onDeleted={handleDeleted} />
      <button
        type="button"
        class="split-hit split-hit--below"
        aria-label="Close preview"
        disabled={closing}
        onclick={deselect}
      ></button>
    </div>
  {/if}
</div>

  {#if selected}
    <button
      type="button"
      class="split-hit split-hit--side split-hit--right"
      aria-label="Close preview"
      disabled={closing}
      onclick={deselect}
    ></button>
  {/if}
</div>

<style>
  .split-shell {
    width: 100%;
  }

  .split-shell--open {
    display: grid;
    grid-template-columns: minmax(0, 1fr) min(100%, 72rem) minmax(0, 1fr);
    align-items: start;
  }

  .split-shell--open .panel {
    grid-column: 2;
    width: min(100%, 72rem);
    max-width: 72rem;
    margin-inline: auto;
  }

  .split-hit {
    border: 0;
    padding: 0;
    margin: 0;
    background: transparent;
    cursor: default;
  }

  .split-hit:disabled {
    pointer-events: none;
  }

  .split-hit--side {
    grid-row: 1;
    align-self: stretch;
    min-height: 12rem;
  }

  .split-hit--left {
    grid-column: 1;
  }

  .split-hit--right {
    grid-column: 3;
  }

  .panel {
    display: grid;
    gap: var(--space-4);
    width: min(100%, 40rem);
    max-width: 40rem;
    margin-inline: auto;
    grid-template-columns: minmax(0, 40rem);
    transition:
      width var(--panel-collapse-ms, 520ms) ease,
      max-width var(--panel-collapse-ms, 520ms) ease,
      grid-template-columns var(--panel-collapse-ms, 520ms) ease;
  }

  .panel--selected {
    width: min(100%, 72rem);
    max-width: 72rem;
    grid-template-columns: minmax(0, 40rem) minmax(0, 1fr);
    align-items: start;
    gap: var(--space-5);
    overflow: visible;
  }

  .panel--closing.panel--selected {
    width: min(100%, 40rem);
    max-width: 40rem;
    grid-template-columns: minmax(0, 40rem) minmax(0, 0fr);
    transition-delay: var(--stagger-ms, 180ms);
  }

  .split-shell--open .panel--closing.panel--selected {
    max-width: 40rem;
    margin-inline: auto;
  }

  .main-column {
    display: grid;
    gap: var(--space-4);
    min-width: 0;
    width: 100%;
    scroll-margin-top: 5rem;
  }

  .output {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    width: 100%;
    min-height: 100%;
    opacity: 0;
    transform: translateX(1rem);
    overflow: visible;
    animation: slide-in var(--output-exit-ms, 520ms) ease var(--stagger-ms, 180ms) forwards;
  }

  .split-hit--below {
    flex: 1 1 auto;
    min-height: 2.5rem;
    width: 100%;
  }

  .split-close {
    position: absolute;
    top: 0;
    left: 100%;
    z-index: 2;
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    margin-left: var(--space-3);
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-text-muted);
    padding: 0;
    cursor: pointer;
    transition: color var(--transition-fast);
  }

  .split-close:hover:not(:disabled) {
    color: var(--color-text);
  }

  .split-close:disabled {
    cursor: default;
    opacity: 0.5;
  }

  .split-close svg {
    width: 1.15rem;
    height: 1.15rem;
  }

  .output--closing {
    animation: slide-out var(--output-exit-ms, 520ms) ease forwards;
    pointer-events: none;
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateX(1rem);
    }

    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slide-out {
    from {
      opacity: 1;
      transform: translateX(0);
    }

    to {
      opacity: 0;
      transform: translateX(1rem);
    }
  }

  @media (max-width: 980px) {
    .split-shell--open {
      grid-template-columns: 1fr;
    }

    .split-shell--open .panel {
      grid-column: 1;
    }

    .split-hit--side {
      display: none;
    }

    .panel--selected {
      grid-template-columns: 1fr;
    }

    .panel--closing.panel--selected {
      grid-template-columns: 1fr;
    }

    .split-close {
      left: auto;
      right: 0;
      margin-left: 0;
    }

    .output {
      transform: translateY(1rem);
      animation-name: slide-in-mobile;
    }

    .output--closing {
      animation-name: slide-out-mobile;
    }
  }

  @keyframes slide-in-mobile {
    from {
      opacity: 0;
      transform: translateY(1rem);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slide-out-mobile {
    from {
      opacity: 1;
      transform: translateY(0);
    }

    to {
      opacity: 0;
      transform: translateY(1rem);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .panel,
    .main-column,
    .output {
      animation: none;
      transition: none;
      opacity: 1;
      transform: none;
    }
  }
</style>
