<script lang="ts">
  let {
    tone = 'default',
    children
  }: { tone?: 'default' | 'solid' | 'glass' | 'accent'; children?: import('svelte').Snippet } = $props();
</script>

<section class="card {tone}">
  {@render children?.()}
</section>

<style>
  .card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface-solid);
    box-shadow: var(--shadow-sm);
  }

  .solid {
    background: var(--color-surface-solid);
  }

  .glass {
    background: var(--color-surface-glass);
    backdrop-filter: var(--glass-blur);
  }

  .accent {
    border-color: rgba(239, 29, 29, 0.34);
    box-shadow:
      var(--shadow-sm),
      0 0 34px rgba(239, 29, 29, 0.12);
  }
</style>
