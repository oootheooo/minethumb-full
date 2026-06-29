<script lang="ts">
  import Button from '$lib/components/Button.svelte';
  import { TextInput } from '$lib/components/fields';

  let { data, form } = $props();

  let firstName = $state('');
  let lastName = $state('');
  let username = $state('');

  $effect(() => {
    firstName = form?.first_name ?? data.profile.first_name ?? '';
    lastName = form?.last_name ?? data.profile.last_name ?? '';
    username = form?.username ?? data.profile.username ?? '';
  });
</script>

<svelte:head><title>Settings | MineThumb</title></svelte:head>

<section class="settings">
  <div class="settings-header">
    <span class="eyebrow">Settings</span>
    <h1>Creator settings</h1>

    {#if form?.success}
      <p class="form-notice form-notice--success">Settings saved.</p>
    {:else if form?.message}
      <p class="form-notice form-notice--error">{form.message}</p>
    {/if}
  </div>

  <form method="POST" class="settings-form">
    <TextInput
      label="First name"
      name="first_name"
      bind:value={firstName}
      autocomplete="given-name"
      required
      maxlength={50}
    />

    <TextInput
      label="Last name"
      name="last_name"
      bind:value={lastName}
      autocomplete="family-name"
      required
      maxlength={50}
    />

    <TextInput
      label="Username"
      name="username"
      bind:value={username}
      autocomplete="username"
      required
      maxlength={30}
      pattern="[A-Za-z0-9_]{3,30}"
      spellcheck={false}
      hint="Letters, numbers, and underscores only."
    />

    <div class="actions">
      <Button type="submit">Save changes</Button>
      <a href="/logout">Log out</a>
    </div>
  </form>
</section>

<style>
  .settings {
    display: grid;
    gap: var(--space-5);
    width: min(28rem, 100%);
    margin-inline: auto;
  }

  .settings-header {
    display: grid;
    gap: var(--space-2);
    text-align: center;
  }

  h1 {
    margin: 0;
  }

  .settings-form {
    display: grid;
    gap: var(--field-grid-gap);
    justify-items: center;
  }

  .settings-form :global(.input-field) {
    width: min(100%, 20rem);
  }

  .settings-form :global(.input-field__input) {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-ui);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    margin-top: var(--space-1);
  }

  .actions a {
    color: var(--color-primary-hover);
    font-weight: var(--font-weight-ui);
  }
</style>
