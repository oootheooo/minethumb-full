<script lang="ts">
  import BackLink from '$lib/components/BackLink.svelte';
  import Button from '$lib/components/Button.svelte';
  import Logo from '$lib/components/Logo.svelte';

  let { form } = $props();
</script>

<svelte:head><title>Sign up | MineThumb</title></svelte:head>

<main class="auth">
  <BackLink inset />
  <form method="POST" class="panel stack-form">
    <Logo />
    <div>
      <h1>Start generating</h1>
      <p>Create your MineThumb account and get 2 free thumbnail credits.</p>
    </div>

    {#if form?.message}
      <p class="form-notice form-notice--error">{form.message}</p>
    {/if}

    <label class="field-box">
      <span class="field-box__label">First name</span>
      <input
        name="first_name"
        autocomplete="given-name"
        value={form?.first_name || ''}
        required
        maxlength="50"
      />
    </label>

    <label class="field-box">
      <span class="field-box__label">Last name</span>
      <input
        name="last_name"
        autocomplete="family-name"
        value={form?.last_name || ''}
        required
        maxlength="50"
      />
    </label>

    <label class="field-box">
      <span class="field-box__label">Username</span>
      <input
        name="username"
        autocomplete="username"
        value={form?.username || ''}
        required
        maxlength="30"
        pattern="[A-Za-z0-9_]{3,30}"
        spellcheck="false"
      />
      <small>Letters, numbers, and underscores only.</small>
    </label>

    <label class="field-box">
      <span class="field-box__label">Email</span>
      <input name="email" type="email" value={form?.email || ''} required />
    </label>

    <label class="field-box">
      <span class="field-box__label">Password</span>
      <input name="password" type="password" minlength="6" required />
    </label>

    <Button type="submit" full>Create account</Button>
    <a href="/login">Already have an account? Log in</a>
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
