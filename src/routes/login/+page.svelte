<script lang="ts">
  import BackLink from '$lib/components/BackLink.svelte';
  import Button from '$lib/components/Button.svelte';
  import Logo from '$lib/components/Logo.svelte';

  let { form } = $props();
</script>

<svelte:head><title>Log in | MineThumb</title></svelte:head>

<main class="auth">
  <BackLink inset />
  <form method="POST" class="panel stack-form">
    <Logo />
    <div>
      <h1>Welcome back</h1>
      <p>Log in to generate and manage your Minecraft thumbnails.</p>
    </div>

    {#if form?.message}
      <p class="form-notice form-notice--error">{form.message}</p>
    {/if}

    <label class="field-box">
      <span class="field-box__label">Email</span>
      <input name="email" type="email" value={form?.email || ''} required />
    </label>

    <label class="field-box">
      <span class="field-box__label">Password</span>
      <input name="password" type="password" required />
    </label>

    <Button type="submit" full>Log in</Button>
    <a href="/signup">Need an account? Sign up</a>
  </form>
</main>

<style>
  .auth {
    position: relative;
    display: grid;
    min-height: 100dvh;
    place-items: center;
    padding: 1rem;
  }

  .panel {
    width: min(100%, 28rem);
  }

  h1 {
    margin: 0;
    font-size: var(--text-2xl);
  }

  p,
  a {
    color: var(--color-text-muted);
  }
</style>
