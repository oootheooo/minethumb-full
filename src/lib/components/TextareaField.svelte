<script lang="ts">
  let {
    label,
    placeholder,
    value = $bindable(''),
    maxlength = 500,
    required = false,
    insetLabel = true,
    optional = false,
    showCounter = true,
    collapseWhenEmpty = false,
    scrollable = false,
    fixedHeight = false,
    readonly = false,
    dimmed = false,
    expanded = false,
    previewCollapsed = false,
    composerField = false,
    heading,
    actionLabel,
    actionDisabled = false,
    actionLoading = false,
    onAction,
    secondaryActionLabel,
    onSecondaryAction
  }: {
    label: string;
    placeholder: string;
    value?: string;
    maxlength?: number;
    required?: boolean;
    insetLabel?: boolean;
    optional?: boolean;
    showCounter?: boolean;
    collapseWhenEmpty?: boolean;
    scrollable?: boolean;
    fixedHeight?: boolean;
    readonly?: boolean;
    dimmed?: boolean;
    expanded?: boolean;
    previewCollapsed?: boolean;
    composerField?: boolean;
    heading?: string;
    actionLabel?: string;
    actionDisabled?: boolean;
    actionLoading?: boolean;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
  } = $props();

  let textareaEl = $state<HTMLTextAreaElement | null>(null);
  let focused = $state(false);

  const fieldId = `field-${Math.random().toString(36).slice(2, 9)}`;
  const showFooterAction = $derived(Boolean(onAction && actionLabel && !readonly));
  const reserveActionSlot = $derived(Boolean(actionLabel && readonly && !showFooterAction));

  const isCollapsed = $derived(collapseWhenEmpty && !value.trim() && !focused && !previewCollapsed);
  const lockTextareaHeight = $derived(scrollable || fixedHeight || previewCollapsed);

  const syncHeight = (node: HTMLTextAreaElement) => {
    if (lockTextareaHeight || readonly || (collapseWhenEmpty && !value.trim() && !focused)) {
      if (collapseWhenEmpty && !value.trim() && !focused) {
        node.style.height = '0px';
      } else if (lockTextareaHeight || readonly) {
        node.style.height = '';
      }
      return;
    }

    node.style.height = '0px';
    node.style.height = `${node.scrollHeight}px`;
  };

  const autoResize = (node: HTMLTextAreaElement) => {
    if (lockTextareaHeight || readonly) return {};

    const sync = () => syncHeight(node);

    sync();
    node.addEventListener('input', sync);

    return {
      destroy() {
        node.removeEventListener('input', sync);
      }
    };
  };

  $effect(() => {
    value;
    focused;
    scrollable;
    fixedHeight;
    readonly;
    if (textareaEl) syncHeight(textareaEl);
  });
</script>

{#if insetLabel}
  <div class="field-box-wrapper">
    {#if heading}
      <p class="field-box__heading">{heading}</p>
    {/if}
    <div
      class="field-box"
      class:field-box--collapsed={isCollapsed}
      class:field-box--active={focused}
      class:field-box--scrollable={scrollable}
      class:field-box--fixed-height={fixedHeight}
      class:field-box--readonly={readonly}
      class:field-box--dimmed={dimmed}
      class:field-box--expanded={expanded}
      class:field-box--preview-collapsed={previewCollapsed}
      class:field-box--composer={composerField}
      onmousedown={(event) => {
        if (readonly || previewCollapsed) return;
        if (isCollapsed && textareaEl) {
          event.preventDefault();
          focused = true;
          requestAnimationFrame(() => textareaEl?.focus());
        }
      }}
    >
      <label class="field-box__label" for={fieldId}>
        {label}
        {#if required}
          <em class="required">Required</em>
        {:else if optional && !value.trim()}
          <em>Optional</em>
        {/if}
      </label>
      <textarea
        id={fieldId}
        bind:this={textareaEl}
        use:autoResize
        bind:value
        {placeholder}
        {maxlength}
        {required}
        {readonly}
        tabindex={previewCollapsed ? -1 : undefined}
        onfocus={() => (focused = true)}
        onblur={() => (focused = false)}
      ></textarea>
      {#if showFooterAction}
        <div class="field-box__actions">
          {#if secondaryActionLabel && onSecondaryAction}
            <button
              type="button"
              class="field-box__action field-box__action--secondary"
              disabled={actionLoading}
              onclick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onSecondaryAction?.();
              }}
            >
              <svg class="field-box__action-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M20 12H6m0 0 4.5-4.5M6 12l4.5 4.5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              {secondaryActionLabel}
            </button>
          {/if}
          <button
            type="button"
            class="field-box__action"
            disabled={actionDisabled || actionLoading}
            onclick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onAction?.();
            }}
          >
            {#if actionLoading}
              <span class="field-box__action-spinner" aria-hidden="true"></span>
            {/if}
            {actionLabel}
            {#if !actionLoading}
              <svg class="field-box__action-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 12h14m0 0-4.5-4.5M18 12l-4.5 4.5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            {/if}
          </button>
        </div>
      {:else if reserveActionSlot}
        <span class="field-box__action field-box__action--reserved" aria-hidden="true">
          {actionLabel}
          <svg class="field-box__action-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 12h14m0 0-4.5-4.5M18 12l-4.5 4.5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      {:else if showCounter}
        <small class="field-box__counter">{value.length}/{maxlength}</small>
      {/if}
    </div>
  </div>
{:else}
  <label class="field-legacy">
    <span class="field-box__label">{label}</span>
    <textarea bind:value {placeholder} {maxlength} {required}></textarea>
    {#if showCounter}
      <small class="field-box__counter">{value.length}/{maxlength}</small>
    {/if}
  </label>
{/if}

<style>
  .field-legacy {
    display: grid;
    gap: 0.55rem;
  }

  .field-legacy textarea {
    min-height: 9.5rem;
    resize: vertical;
    border: 1px solid var(--field-border);
    border-radius: var(--radius-sm);
    background: rgba(0, 0, 0, 0.3);
    color: var(--color-text);
    padding: 0.95rem;
    line-height: var(--leading-normal);
    outline: none;
  }

  .field-legacy textarea:focus {
    border-color: var(--field-border-focus);
    box-shadow: var(--field-focus-ring);
  }
</style>
