<script lang="ts">
  type Props = {
    href?: string;
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'light';
    disabled?: boolean;
    loading?: boolean;
    full?: boolean;
    size?: 'default' | 'sm';
    children?: import('svelte').Snippet;
    [key: string]: unknown;
  };

  let {
    href,
    type = 'button',
    variant = 'primary',
    disabled = false,
    loading = false,
    full = false,
    size = 'default',
    children,
    ...rest
  }: Props = $props();
</script>

{#if href}
  <a class:full class="button {variant} {size}" href={href} aria-disabled={disabled} {...rest}>
    {@render children?.()}
  </a>
{:else}
  <button class:full class="button {variant} {size}" {type} disabled={disabled || loading} {...rest}>
    {#if loading}
      <span class="spinner" aria-hidden="true"></span>
    {/if}
    {@render children?.()}
  </button>
{/if}

<style>
  .button {
    display: inline-flex;
    min-height: 2.8rem;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    padding: 0.78rem 1rem;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    color: var(--color-text);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-ui);
    line-height: var(--leading-none);
    transition:
      transform var(--transition-fast),
      background var(--transition-fast),
      border-color var(--transition-fast);
  }

  .button:hover {
    transform: translateY(-1px);
  }

  .primary {
    background: var(--color-primary);
    box-shadow: 0 0 30px rgba(239, 29, 29, 0.28);
  }

  .primary:hover {
    background: var(--color-primary-hover);
  }

  .secondary {
    background: var(--color-bg-raised);
    border-color: var(--color-border-strong);
  }

  .ghost {
    background: transparent;
    border-color: transparent;
    color: var(--color-text-muted);
  }

  .danger {
    background: rgba(239, 68, 68, 0.14);
    border-color: rgba(239, 68, 68, 0.32);
    color: #fecaca;
  }

  .light {
    background: #fff;
    color: #0a0a0a;
    border-color: rgba(255, 255, 255, 0.85);
  }

  .light:hover {
    background: #f0f0f0;
  }

  .light .spinner {
    border-color: rgba(10, 10, 10, 0.25);
    border-top-color: #0a0a0a;
  }

  .sm {
    min-height: 2rem;
    padding: 0.4rem 0.75rem;
    font-size: var(--text-xs);
  }

  .full {
    width: 100%;
  }

  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 800ms linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
