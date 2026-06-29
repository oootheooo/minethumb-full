<script lang="ts">
  let { credits = 2, plan = 'Free' }: { credits?: number; plan?: string } = $props();
</script>

<div class="pill">
  <strong>{credits}</strong>
  <span>credits · {plan}</span>
</div>

<style>
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    border: 1px solid rgba(250, 204, 21, 0.28);
    border-radius: var(--radius-full);
    background: rgba(250, 204, 21, 0.08);
    color: var(--color-gold);
    padding: 0.45rem 0.7rem;
    font-size: 0.86rem;
  }

  strong {
    font-weight: var(--font-weight-ui);
  }

  span {
    color: var(--color-text-muted);
  }
</style>
