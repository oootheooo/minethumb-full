<script lang="ts">
  import ImageChip from './ImageChip.svelte';

  let {
    label,
    optional = false,
    disabled = false,
    centerWhenEmpty = true
  }: {
    label: string;
    optional?: boolean;
    disabled?: boolean;
    centerWhenEmpty?: boolean;
  } = $props();

  const inputId = `upload-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;

  let inputEl = $state<HTMLInputElement | null>(null);
  let selectedFile = $state<File | null>(null);
  let previewUrl = $state<string | null>(null);
  let errorMessage = $state<string | null>(null);

  const allowedImageTypes = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

  export function getFile() {
    return selectedFile;
  }

  const isAllowedImage = (fileToCheck: File) => {
    if (fileToCheck.type && allowedImageTypes.has(fileToCheck.type)) return true;
    const ext = fileToCheck.name.split('.').pop()?.toLowerCase();
    return ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp';
  };

  const revokePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  };

  export function clear() {
    selectedFile = null;
    errorMessage = null;
    revokePreview();
    if (inputEl) inputEl.value = '';
  }

  const handleChange = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const picked = input.files?.[0] ?? null;
    if (!picked) return;

    if (!isAllowedImage(picked)) {
      errorMessage = 'Use PNG, JPG, or WEBP only.';
      input.value = '';
      return;
    }

    errorMessage = null;
    revokePreview();
    selectedFile = picked;
    previewUrl = URL.createObjectURL(picked);
  };
</script>

<div class="input-field file-upload">
  <span class="input-field__label">
    {label}
    {#if optional && !selectedFile}
      <em>Optional</em>
    {/if}
  </span>

  <div
    class="input-field__control"
    class:input-field__control--center={centerWhenEmpty && !selectedFile}
  >
    <input
      bind:this={inputEl}
      id={inputId}
      type="file"
      accept="image/png,image/jpeg,image/jpg,image/webp,image/*"
      class="file-upload__input"
      tabindex="-1"
      {disabled}
      onchange={handleChange}
    />

    {#if selectedFile && previewUrl}
      <ImageChip
        src={previewUrl}
        label={selectedFile.name}
        alt="{label} preview"
        onRemove={clear}
      />
    {:else if disabled}
      <span class="upload-trigger upload-trigger--disabled">
        <span class="upload-trigger__content">Upload image</span>
      </span>
    {:else}
      <div class="file-upload__empty">
        <label class="upload-trigger" for={inputId}>
          <span class="upload-trigger__content">
            <svg class="upload-trigger__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 16V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <path
                d="M8 8l4-4 4 4"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path d="M4 20h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            Upload image
          </span>
        </label>
        {#if errorMessage}
          <p class="file-upload__error">{errorMessage}</p>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .file-upload__input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .file-upload__empty {
    display: grid;
    gap: 0.35rem;
    width: 100%;
  }

  .file-upload__error {
    margin: 0;
    color: #f87171;
    font-size: var(--text-xs);
    line-height: 1.2;
  }

  .file-upload .input-field__control {
    position: relative;
    width: 100%;
  }

  .file-upload :global(.image-chip) {
    width: 100%;
    max-width: 100%;
    min-height: 1.75rem;
  }
</style>
