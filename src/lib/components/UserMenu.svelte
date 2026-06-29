<script lang="ts">
  let {
    email = null,
    username = null,
    planId = 'free',
    credits = 2
  }: {
    email?: string | null;
    username?: string | null;
    planId?: string | null;
    credits?: number;
  } = $props();

  let open = $state(false);

  const planLabel = $derived(planId ? planId.charAt(0).toUpperCase() + planId.slice(1) : 'Free');
  const displayName = $derived(username || 'Account');
  const usernameLabel = $derived(username ? `@${username}` : displayName);
  const creditsTone = $derived(credits >= 40 ? 'good' : credits >= 20 ? 'warn' : 'low');

  const toggle = () => {
    open = !open;
  };

  const close = () => {
    open = false;
  };

  const handleDocumentClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.user-menu')) {
      close();
    }
  };

  $effect(() => {
    if (!open) return;

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  });
</script>

<div class="user-menu">
  <span class="credits" aria-label="{credits} credits remaining">
    <strong class="credits-count credits-count--{creditsTone}">{credits}</strong>
    <span class="credits-label">credits remaining</span>
  </span>

  <div class="menu-anchor">
    <button
      type="button"
      class="trigger"
      aria-label="Open account menu for {displayName}"
      aria-expanded={open}
      onclick={toggle}
    >
      <span class="username">{usernameLabel}</span>
    </button>

    {#if open}
      <div class="menu" role="menu" aria-label="Account menu">
        <div class="identity">
          <strong>{usernameLabel}</strong>
          {#if email}
            <span class="email">{email}</span>
          {/if}
          <span class="meta">{credits} credits · {planLabel}</span>
        </div>
        <a href="/billing" role="menuitem" onclick={close}>Plans & Billing</a>
        <a href="/settings" role="menuitem" onclick={close}>Settings</a>
      </div>
    {/if}
  </div>
</div>

<style>
  .user-menu {
    position: relative;
    z-index: 40;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    max-width: min(24rem, calc(100vw - var(--space-8)));
  }

  .menu-anchor {
    position: relative;
    min-width: 0;
  }

  .credits {
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-2);
    flex: 0 0 auto;
    font-size: var(--text-sm);
    line-height: var(--leading-none);
  }

  .credits-count {
    font-weight: var(--font-weight-ui);
    font-variant-numeric: tabular-nums;
  }

  .credits-count--good {
    color: var(--color-minecraft-green);
  }

  .credits-count--warn {
    color: var(--color-gold);
  }

  .credits-count--low {
    color: var(--color-danger);
  }

  .credits-label {
    color: var(--color-text);
    font-weight: var(--font-weight-body);
  }

  .menu {
    position: absolute;
    top: calc(100% + var(--space-2));
    right: 0;
    display: grid;
    gap: var(--space-1);
    width: min(16rem, calc(100vw - var(--space-8)));
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    box-shadow: var(--shadow-md);
    backdrop-filter: blur(18px);
    padding: var(--space-2);
    animation: drop var(--transition-base);
  }

  .identity {
    display: grid;
    gap: var(--space-1);
    border-bottom: 1px solid var(--color-border);
    padding: var(--space-2) var(--space-3) var(--space-3);
  }

  .identity strong,
  .identity .email,
  .identity .meta,
  .username {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .identity strong {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-ui);
  }

  .email,
  .meta {
    color: var(--color-text-muted);
    font-size: var(--text-xs);
    font-weight: var(--font-weight-body);
  }

  .menu a {
    border-radius: var(--radius-sm);
    color: var(--color-text);
    padding: 0.72rem var(--space-3);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-ui);
    transition: background var(--transition-fast);
  }

  .menu a:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .trigger {
    display: flex;
    min-width: 0;
    align-items: center;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(18px);
    color: var(--color-text);
    padding: var(--space-2) var(--space-3);
    text-align: left;
    transition:
      border-color var(--transition-fast),
      background var(--transition-fast);
  }

  .trigger:hover {
    border-color: var(--color-border-strong);
    background: var(--color-bg-elevated);
  }

  .trigger[aria-expanded='true'] {
    border-color: var(--color-border-strong);
    background: var(--color-bg-elevated);
  }

  .username {
    min-width: 0;
    font-size: var(--text-sm);
    font-weight: var(--font-weight-ui);
    line-height: var(--leading-none);
  }

  @keyframes drop {
    from {
      opacity: 0;
      transform: translateY(-0.35rem);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

</style>
