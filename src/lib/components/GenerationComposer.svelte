<script lang="ts">
  import { createThumbnailGeneration, recreateThumbnailGeneration } from '$lib/generation/api';
  import type { Generation } from '$lib/types/generation';
  import { env } from '$env/dynamic/public';
  import FileUpload from './FileUpload.svelte';
  import TextareaField from './TextareaField.svelte';
  import { TextInput } from './fields';

  let {
    selected = null,
    onCreated,
    onDeselect
  }: {
    selected?: Generation | null;
    onCreated?: (generation: Generation) => void;
    onDeselect?: () => void;
  } = $props();

  const maxLength = Number(env.PUBLIC_MAX_DESCRIPTION_LENGTH || 500);

  let description = $state('');
  let videoLink = $state('');
  let customPrompt = $state('');
  let loading = $state(false);
  let message = $state('');

  let skinUpload = $state<{ getFile: () => File | null; clear: () => void } | null>(null);
  let faceUpload = $state<{ getFile: () => File | null; clear: () => void } | null>(null);
  let referenceUpload = $state<{ getFile: () => File | null; clear: () => void } | null>(null);

  let lastSelectedId = $state<string | null>(null);

  $effect(() => {
    const id = selected?.id ?? null;
    if (id === lastSelectedId) return;

    lastSelectedId = id;
    description = selected?.video_description ?? '';
    customPrompt = '';
    videoLink = '';
    skinUpload?.clear();
    faceUpload?.clear();
    referenceUpload?.clear();
    message = '';
  });

  const viewingSelected = $derived(Boolean(selected));
  const isSelectedProcessing = $derived(
    Boolean(
      selected && (selected.status === 'queued' || selected.status === 'processing')
    )
  );
  const canGenerate = $derived(Boolean(description.trim()));
  const canModify = $derived(
    Boolean(selected?.status === 'completed' && customPrompt.trim() && !loading)
  );

  const createNew = () => {
    message = '';
    onDeselect?.();
  };

  const generate = async () => {
    if (viewingSelected || !canGenerate || loading) return;

    loading = true;
    message = 'Creating thumbnail…';

    try {
      await createThumbnailGeneration({
        videoDescription: description,
        customPrompt,
        videoLink,
        skin: skinUpload?.getFile() ?? null,
        face: faceUpload?.getFile() ?? null,
        referenceImage: referenceUpload?.getFile() ?? null,
        onCreated: (generation) => {
          message = 'Thumbnail is generating. You can select other items while you wait.';
          onCreated?.(generation);
        }
      });
    } catch (error) {
      message = error instanceof Error ? error.message : 'Could not start generation.';
    } finally {
      loading = false;
    }
  };

  const modify = async () => {
    if (!selected || !canModify || loading) return;

    loading = true;
    message = 'Recreating thumbnail…';

    try {
      await recreateThumbnailGeneration({
        sourceGenerationId: selected.id,
        customPrompt,
        skin: skinUpload?.getFile() ?? null,
        face: faceUpload?.getFile() ?? null,
        referenceImage: referenceUpload?.getFile() ?? null,
        onCreated: (generation) => {
          message = 'Thumbnail is generating. You can select other items while you wait.';
          onCreated?.(generation);
        }
      });
    } catch (error) {
      message = error instanceof Error ? error.message : 'Could not start recreation.';
    } finally {
      loading = false;
    }
  };
</script>

<section class="composer" class:composer--processing={viewingSelected && isSelectedProcessing}>
  <div class="generate-fields">
    {#if viewingSelected}
      <div class="generate-fields__wide generate-fields__modify">
        <TextareaField
          composerField
          label="Modify Thumbnail"
          placeholder="Describe what to change about this thumbnail — text, colors, composition, mood, or layout."
          bind:value={customPrompt}
          maxlength={maxLength}
          expanded
          showCounter={false}
          actionLabel="Modify"
          actionDisabled={!canModify}
          actionLoading={loading}
          onAction={modify}
          secondaryActionLabel="Create New Thumbnail Instead"
          onSecondaryAction={createNew}
        />
      </div>

      <div class="generate-fields__wide">
        <TextareaField
          composerField
          previewCollapsed
          label="Video description"
          placeholder="Describe your Minecraft video. Include the moment, build, mob, farm, challenge, or result viewers should notice."
          bind:value={description}
          maxlength={maxLength}
          required
          readonly
          dimmed
          showCounter={false}
        />
      </div>
    {:else}
      <div class="generate-fields__wide">
        <TextareaField
          composerField
          fixedHeight
          label="Video description"
          placeholder="Describe your Minecraft video. Include the moment, build, mob, farm, challenge, or result viewers should notice."
          bind:value={description}
          maxlength={maxLength}
          required
          showCounter={false}
          actionLabel="Generate thumbnail"
          actionDisabled={!canGenerate}
          actionLoading={loading}
          onAction={generate}
        />
      </div>

      <div class="generate-fields__wide">
        <TextareaField
          composerField
          optional
          collapseWhenEmpty
          label="Custom prompt"
          placeholder="Add extra direction for style, text, mood, or composition."
          bind:value={customPrompt}
          showCounter={false}
        />
      </div>
    {/if}

    <FileUpload bind:this={skinUpload} label="Skin image" optional />
    <FileUpload bind:this={faceUpload} label="Face/Headcam" optional />
    <FileUpload bind:this={referenceUpload} label="Reference image" optional />

    <TextInput
      label="Video link"
      optional
      type="url"
      placeholder="https://youtube.com/watch?v=..."
      bind:value={videoLink}
    />
  </div>

  {#if message}
    <div class="actions">
      <p>{message}</p>
    </div>
  {/if}
</section>

<style>
  .composer {
    display: grid;
    gap: var(--space-4);
    min-width: 0;
    width: 100%;
  }

  .actions {
    display: grid;
    gap: 0.65rem;
    justify-items: start;
  }

  .actions p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-body);
    max-width: 28rem;
  }

  .composer--processing .field-box--composer .field-box__label,
  .composer--processing .field-box--composer textarea,
  .composer--processing .field-box--composer .field-box__action:not(.field-box__action--secondary),
  .composer--processing .input-field {
    opacity: 0.42;
    pointer-events: none;
    transition: opacity var(--transition-fast);
  }
</style>
