<script lang="ts">
  const steps = ['Analyzing video idea...', 'Choosing thumbnail hook...', 'Rendering final image...'];
  let { active = false }: { active?: boolean } = $props();
  let index = $state(0);

  $effect(() => {
    if (!active) {
      index = 0;
      return;
    }
    const timers = [
      setTimeout(() => (index = 0), 0),
      setTimeout(() => (index = 1), 1100),
      setTimeout(() => (index = 2), 2400)
    ];
    return () => timers.forEach(clearTimeout);
  });
</script>

<div class="loading" class:active>
  <span class="spinner" aria-hidden="true"></span>
  <strong>{steps[index]}</strong>
  <div class="bar"><span style={`width: ${active ? (index + 1) * 33.34 : 8}%`}></span></div>
</div>

<style>
  .loading {
    display: grid;
    place-items: center;
    gap: 1rem;
    color: var(--color-text-muted);
    text-align: center;
  }

  .spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid rgba(255, 255, 255, 0.16);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 900ms linear infinite;
  }

  strong {
    color: var(--color-text);
  }

  .bar {
    width: min(16rem, 100%);
    height: 0.45rem;
    overflow: hidden;
    border-radius: var(--radius-full);
    background: rgba(255, 255, 255, 0.08);
  }

  .bar span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--color-primary), var(--color-gold));
    transition: width 600ms ease;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
