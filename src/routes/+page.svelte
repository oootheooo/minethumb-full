<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import DemoGenerator from '$lib/components/DemoGenerator.svelte';
  import Logo from '$lib/components/Logo.svelte';
  import PricingCard from '$lib/components/PricingCard.svelte';
  import StudioDashboard from '$lib/components/StudioDashboard.svelte';
  import { plans } from '$lib/types/plans';

  let { data } = $props();
</script>

<svelte:head>
  <title>{data.session ? 'Studio | MineThumb' : 'MineThumb | AI Minecraft Thumbnail Generator'}</title>
</svelte:head>

{#if data.session}
  <StudioDashboard />
{:else}
<header class="site-header">
  <nav class="container nav">
    <Logo />
    <div>
      <a href="#features">Features</a>
      <a href="/pricing">Pricing</a>
      <a href="#how">How it works</a>
      <a href="/login">Log in</a>
      <Button href="/signup">Get Started</Button>
    </div>
  </nav>
</header>

<section class="hero">
  <img class="hero-image" src="/images/minecraft-hero.png" alt="" aria-hidden="true" />
  <div class="container hero-grid">
    <section class="copy">
      <h1><span>Minecraft Thumbnails.</span> Made to Get Clicked.</h1>
      <p>
        Create bold, high-converting Minecraft thumbnails in seconds. Built for creators who want
        better clicks without learning design.
      </p>
      <div class="cta">
        <Button href="/signup">Start Generating</Button>
        <Button href="#demo" variant="secondary">See Examples</Button>
      </div>
    </section>
  </div>

  <a class="hero-try eyebrow" href="#demo">Try it now</a>
  <div class="hero-bottom-extension" aria-hidden="true"></div>
</section>

<main>
  <div class="container">
    <DemoGenerator />
  </div>

  <section class="container features" id="features">
    <div>
      <span class="eyebrow">Built for creators</span>
      <h2>Everything points toward the click.</h2>
    </div>
    <div class="feature-grid">
      {#each ['Designed for clicks', 'Minecraft-specific prompts', 'Skin and screenshot support', 'Fast generation', 'Saved thumbnail history', 'Simple creator workflow'] as feature}
        <article>{feature}</article>
      {/each}
    </div>
  </section>

  <section class="container how" id="how">
    <span class="eyebrow">How it works</span>
    <div class="steps">
      <article><strong>1</strong><span>Describe your video</span></article>
      <article><strong>2</strong><span>Add optional skin or screenshot</span></article>
      <article><strong>3</strong><span>Generate a clickable thumbnail</span></article>
    </div>
  </section>

  <section class="container pricing-preview">
    {#each plans as plan}
      <PricingCard {plan} />
    {/each}
  </section>
</main>

<footer class="container footer">
  <Logo />
  <span>AI thumbnails for Minecraft creators.</span>
</footer>
{/if}

<style>
  .site-header {
    position: relative;
    z-index: 5;
    background: #050505;
  }

  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.85rem 0;
  }

  .nav div {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .nav a {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-ui);
  }

  .hero {
    position: relative;
    z-index: 1;
    height: min(calc(100dvh - 4.5rem), 37rem);
    overflow: visible;
    background: #050505;
    isolation: isolate;
  }

  .hero::before {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    content: '';
    background:
      linear-gradient(to bottom, #050505 0%, transparent 24%),
      linear-gradient(
        to bottom,
        transparent 58%,
        rgba(5, 5, 5, 0.45) 78%,
        #050505 100%
      );
  }

  .hero::after {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    content: '';
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.16) 0%,
      rgba(0, 0, 0, 0.1) 34%,
      rgba(0, 0, 0, 0.02) 62%,
      rgba(0, 0, 0, 0.16) 100%
    );
  }

  .hero-grid {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: grid;
    grid-template-columns: minmax(0, 0.85fr) minmax(18rem, 1.15fr);
    align-items: center;
    gap: 1.5rem;
    margin-inline: auto;
    padding: clamp(1.5rem, 3.5vh, 2.5rem) 0;
  }

  .copy {
    position: relative;
    z-index: 2;
    display: grid;
    gap: 0.85rem;
  }

  .copy h1 {
    max-width: 38rem;
    margin: 0;
    font-size: clamp(2.35rem, 4.3vw, 4.1rem);
    line-height: 0.96;
  }

  .copy h1 span {
    display: block;
  }

  .copy h1:not(span) {
    color: var(--color-primary-hover);
  }

  .copy p {
    max-width: 31rem;
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--text-md);
    font-weight: var(--font-weight-body);
    line-height: var(--leading-relaxed);
  }

  .cta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    margin-top: 0.5rem;
  }

  .hero-try {
    position: absolute;
    bottom: 1.15rem;
    left: 50%;
    z-index: 3;
    transform: translateX(-50%);
    padding: 0.25rem 0.5rem;
    transition: color var(--transition-fast);
  }

  .hero-try:hover {
    color: var(--color-text);
  }

  .hero-image {
    position: absolute;
    inset: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 72% center;
    pointer-events: none;
  }

  .hero-bottom-extension {
    position: absolute;
    right: 0;
    bottom: -4.5rem;
    left: 0;
    z-index: 4;
    height: 4.5rem;
    pointer-events: none;
    user-select: none;
    background: linear-gradient(180deg, #050505 0%, rgba(5, 5, 5, 0.94) 22%, var(--color-bg-app) 100%);
  }

  main {
    position: relative;
    z-index: 0;
  }

  .features,
  .how,
  .pricing-preview {
    padding: var(--space-16) 0;
  }

  .features {
    display: grid;
    grid-template-columns: 0.8fr 1.2fr;
    gap: 2rem;
  }

  h2 {
    margin: 0.6rem 0 0;
    font-size: clamp(2rem, 4vw, 3.8rem);
    line-height: 1;
  }

  .feature-grid,
  .steps,
  .pricing-preview {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }

  .feature-grid article,
  .steps article {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: rgba(255, 255, 255, 0.04);
    padding: 1rem;
    font-size: var(--text-sm);
    font-weight: var(--font-weight-ui);
  }

  .steps strong {
    display: grid;
    width: 2.4rem;
    height: 2.4rem;
    margin-bottom: 1rem;
    place-items: center;
    border-radius: var(--radius-sm);
    background: var(--color-primary);
  }

  .footer {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    border-top: 1px solid var(--color-border);
    color: var(--color-text-muted);
    padding: 2rem 0;
  }

  @media (max-width: 900px) {
    .nav div {
      display: none;
    }

    .hero-grid,
    .features,
    .feature-grid,
    .steps,
    .pricing-preview {
      grid-template-columns: 1fr;
    }

    .hero {
      height: min(calc(100dvh - 4.25rem), 31rem);
    }

    .copy h1 {
      font-size: clamp(2.1rem, 7vw, 2.95rem);
    }

    .copy p {
      font-size: 0.98rem;
    }

    .hero-image {
      object-fit: cover;
      object-position: 58% center;
    }
  }
</style>
