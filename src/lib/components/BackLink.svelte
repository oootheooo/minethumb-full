<script lang="ts">
  let {
    href = '/',
    label = 'Back',
    inset = false
  }: { href?: string; label?: string; inset?: boolean } = $props();
</script>

<a class="back-link" class:back-link--inset={inset} {href}>
  <span class="back-link__icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M19 12H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      <path
        d="M6 12l6-6M6 12l6 6"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </span>
  <span>{label}</span>
</a>
