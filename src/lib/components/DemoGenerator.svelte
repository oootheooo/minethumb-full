<script lang="ts">
  import { env } from '$env/dynamic/public';
  import Button from './Button.svelte';
  import FileUpload from './FileUpload.svelte';
  import ImageChip from './ImageChip.svelte';
  import LoadingSteps from './LoadingSteps.svelte';
  import TextareaField from './TextareaField.svelte';
  import { InputField, TextInput } from './fields';

  const maxLength = Number(env.PUBLIC_MAX_DESCRIPTION_LENGTH || 500);

  let demoPhase = $state<'idle' | 'loading' | 'done'>('idle');
  let description = $state(
    'In this video I made a mud farm that bypasses dispenser delays so you can place dirt blocks as fast as you can to be converted into mud. To farm, just hold right click on the torch to place dirt.'
  );
  let face = $state<File | null>(null);
  let referenceImage = $state<File | null>(null);
  let videoLink = $state('https://youtu.be/YxYG3Mp0hHw');
  let customPrompt = $state('');
  let message = $state('');

  const runDemo = () => {
    if (!description.trim()) {
      message = 'Please add a video description before generating.';
      return;
    }

    message = '';
    demoPhase = 'loading';
    setTimeout(() => {
      demoPhase = 'done';
    }, 4000);
  };
</script>

<section class="demo" id="demo">
  <div class="heading">
    <h2>See a Minecraft idea become a clickable thumbnail.</h2>
  </div>

  <div
    class="panel"
    class:panel--done={demoPhase === 'done'}
  >
    <div class="form-shell">
      <div class="form" class:form--blurred={demoPhase === 'loading'}>
        <div class="generate-fields">
          <InputField label="Skin image" hasValue>
            <ImageChip
              src="/images/sample-skin-image.jpg"
              label="sample-skin-image.jpg"
              alt="Sample Minecraft skin"
            />
          </InputField>

          <FileUpload label="Face/Headcam" optional disabled />
          <FileUpload label="Reference image" optional disabled />

          <TextInput
            label="Video link"
            optional
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            bind:value={videoLink}
            readonly
          />

          <div class="generate-fields__wide">
            <TextareaField
              composerField
              scrollable
              readonly
              label="Video description"
              placeholder="Describe your Minecraft video. Include the moment, build, mob, farm, challenge, or result viewers should notice."
              bind:value={description}
              maxlength={maxLength}
              required
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
        </div>

        <div class="actions">
          {#if message}
            <p class="message">{message}</p>
          {/if}
          <Button disabled={demoPhase === 'loading'} onclick={runDemo}>Generate thumbnail</Button>
        </div>
      </div>

      {#if demoPhase === 'loading'}
        <div class="loading-overlay" aria-live="polite">
          <LoadingSteps active />
        </div>
      {/if}
    </div>

    {#if demoPhase === 'done'}
        <div class="middle" aria-hidden="true">
          <span>→</span>
        </div>

        <div class="output">
          <img class="thumb" src="/images/sample-generated-image.png" alt="Generated demo thumbnail" />
          <div>
            <strong>Want thumbnails like this?</strong>
            <Button href="/signup" variant="secondary">Create your first thumbnail</Button>
          </div>
        </div>
      {/if}
  </div>
</section>

<style>
  .demo {
    padding: var(--space-20) 0;
  }

  .heading {
    width: 100%;
    margin: 0 auto var(--space-8);
    text-align: center;
    container-type: inline-size;
  }

  h2 {
    margin: 0;
    font-size: clamp(0.875rem, 2.85cqi, 2.1rem);
    font-weight: var(--font-weight-heading);
    line-height: var(--leading-none);
    white-space: nowrap;
  }

  .panel {
    display: grid;
    gap: 1rem;
    width: min(100%, 40rem);
    margin-inline: auto;
    grid-template-columns: 1fr;
    transition: width 520ms ease;
  }

  .panel--done {
    width: 100%;
    max-width: min(100%, 72rem);
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
  }

  .panel--done .form-shell {
    min-width: 0;
    width: 100%;
  }

  .panel--done .form {
    width: 100%;
    min-width: 0;
  }

  .panel--done .generate-fields {
    min-width: 0;
  }

  .form-shell {
    position: relative;
  }

  .form {
    display: grid;
    gap: 1rem;
  }

  .form--blurred {
    filter: blur(5px);
    opacity: 0.55;
    pointer-events: none;
    user-select: none;
  }

  .loading-overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: grid;
    place-items: center;
    padding: 2rem 1rem;
  }

  .actions {
    display: grid;
    gap: 0.65rem;
    justify-items: start;
  }

  .message {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  .middle {
    display: grid;
    place-items: center;
    align-self: center;
    opacity: 0;
    animation: reveal 420ms ease 120ms forwards;
  }

  .middle > span {
    display: grid;
    width: 3rem;
    height: 3rem;
    place-items: center;
    border-radius: var(--radius-full);
    background: var(--color-primary-soft);
    color: var(--color-primary-hover);
    font-size: 2rem;
  }

  .output {
    display: grid;
    gap: 1rem;
    align-content: start;
    min-width: 0;
    width: 100%;
    opacity: 0;
    transform: translateX(1rem);
    animation: slide-in 520ms ease 180ms forwards;
  }

  .thumb {
    width: 100%;
    aspect-ratio: 16 / 9;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    object-fit: contain;
    background: var(--color-bg-muted);
  }

  .output strong {
    display: block;
    margin-bottom: 0.75rem;
  }

  @keyframes reveal {
    from {
      opacity: 0;
      transform: scale(0.92);
    }

    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateX(1rem);
    }

    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @media (max-width: 860px) {
    .panel--done {
      grid-template-columns: 1fr;
    }

    .middle {
      min-height: 3rem;
    }

    .output {
      transform: translateY(1rem);
      animation-name: slide-in-mobile;
    }
  }

  @keyframes slide-in-mobile {
    from {
      opacity: 0;
      transform: translateY(1rem);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .panel,
    .middle,
    .output {
      animation: none;
      transition: none;
      opacity: 1;
      transform: none;
    }
  }
</style>
