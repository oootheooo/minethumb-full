<script lang="ts">
  let { compact = false }: { compact?: boolean } = $props();
</script>

<a class="logo" class:compact href="/" aria-label="MineThumb home">
  <img
    src="/images/minecraft-thumbnail-logo.png"
    alt=""
    aria-hidden="true"
    width="1254"
    height="1254"
  />
  {#if !compact}
    <strong>MineThumb</strong>
  {/if}
</a>

<style>
  .logo {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--tracking-normal);
  }

  img {
    width: auto;
    height: 2.35rem;
    flex: 0 0 auto;
  }

  .compact img {
    height: 1.85rem;
  }

  strong {
    font-size: var(--text-lg);
  }
</style>
