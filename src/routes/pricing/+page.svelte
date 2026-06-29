<script lang="ts">
  import BackLink from '$lib/components/BackLink.svelte';
  import Logo from '$lib/components/Logo.svelte';
  import PricingCard from '$lib/components/PricingCard.svelte';
  import { plans } from '$lib/types/plans';
</script>

<svelte:head><title>Pricing | MineThumb</title></svelte:head>

<main class="pricing container">
  <nav>
    <div class="nav-brand">
      <BackLink />
      <Logo />
    </div>
    <a class="login-link" href="/login">Log in</a>
  </nav>

  <header>
    <span class="eyebrow">Pricing</span>
    <h1>Start free. Upgrade when thumbnails become part of your workflow.</h1>
    <p>Plans are credit based, so every generation is easy to understand and control.</p>
  </header>

  <section class="plans">
    {#each plans as plan}
      <PricingCard {plan} />
    {/each}
  </section>
</main>

<style>
  .pricing {
    padding: 1.2rem 0 var(--space-20);
  }

  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .nav-brand {
    position: relative;
    display: flex;
    align-items: center;
  }

  .nav-brand :global(.back-link) {
    position: absolute;
    right: 100%;
    margin-right: 0.75rem;
    white-space: nowrap;
  }

  .login-link {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-ui);
  }

  header {
    width: min(40rem, 100%);
    padding: var(--space-8) 0 var(--space-4);
  }

  h1 {
    margin: 0.45rem 0 0.65rem;
    font-size: clamp(1.25rem, 2.5vw, 1.5rem);
    line-height: var(--leading-snug);
  }

  header p {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-body);
    line-height: var(--leading-relaxed);
  }

  .plans {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }

  @media (max-width: 860px) {
    .plans {
      grid-template-columns: 1fr;
    }
  }
</style>
