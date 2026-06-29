<script lang="ts">
  let {
    src,
    label,
    alt = '',
    onRemove
  }: {
    src: string;
    label: string;
    alt?: string;
    onRemove?: () => void;
  } = $props();
</script>

<span class="image-chip">
  <img {src} alt={alt || label} />
  <span class="image-chip__label">{label}</span>
  <button
    type="button"
    class="image-chip__remove"
    class:image-chip__remove--inactive={!onRemove}
    aria-label="Remove {label}"
    aria-disabled={!onRemove}
    onclick={() => onRemove?.()}
  >
    <span aria-hidden="true">×</span>
  </button>
</span>

<style>
  .image-chip {
    display: inline-flex;
    max-width: 100%;
    height: var(--field-row-height);
    align-items: center;
    gap: 0.3rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    background: var(--color-bg-raised);
    padding: 0 0.15rem 0 0.15rem;
    vertical-align: middle;
  }

  .image-chip img {
    width: 1rem;
    height: 1rem;
    flex: 0 0 auto;
    border-radius: var(--radius-full);
    object-fit: cover;
  }

  .image-chip__label {
    overflow: hidden;
    min-width: 0;
    flex: 1 1 auto;
    color: var(--color-text);
    font-size: 0.7rem;
    font-weight: var(--font-weight-ui);
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .image-chip__remove {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    padding: 0 0.1rem;
    border: 0;
    background: none;
    color: var(--color-text-faint);
    font-size: 0.85rem;
    line-height: 1;
    cursor: pointer;
    transition: color var(--transition-fast);
  }

  .image-chip__remove:hover {
    color: var(--color-primary-hover);
  }

  .image-chip__remove--inactive {
    cursor: default;
  }
</style>
