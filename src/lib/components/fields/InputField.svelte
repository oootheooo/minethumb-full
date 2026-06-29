<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    label,
    optional = false,
    hasValue = false,
    centerControl = false,
    hint = '',
    children
  }: {
    label: string;
    optional?: boolean;
    hasValue?: boolean;
    centerControl?: boolean;
    hint?: string;
    children: Snippet;
  } = $props();
</script>

<div class="input-field" class:input-field--with-hint={!!hint}>
  <span class="input-field__label">
    {label}
    {#if optional && !hasValue}
      <em>Optional</em>
    {/if}
  </span>
  <div
    class="input-field__control"
    class:input-field__control--center={centerControl}
  >
    {@render children()}
  </div>
  {#if hint}
    <small class="input-field__hint">{hint}</small>
  {/if}
</div>
