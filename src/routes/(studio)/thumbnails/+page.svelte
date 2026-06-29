<script lang="ts">
  import GenerationList from '$lib/components/GenerationList.svelte';
  import ResultViewer from '$lib/components/ResultViewer.svelte';
  import { getGenerationsContext } from '$lib/generation/context';
  import type { Generation } from '$lib/types/generation';

  const generationsContext = getGenerationsContext();

  let selected = $state<Generation | null>(null);

  const handleDeleted = async (generationId: string) => {
    if (selected?.id === generationId) {
      selected = null;
    }
    generationsContext.removeById(generationId);
  };
</script>

<svelte:head><title>My Thumbnails | MineThumb</title></svelte:head>

<div class="page">
  <section>
    <h1>My thumbnails</h1>
    <GenerationList
      selectedId={selected?.id}
      onSelect={(generation) => (selected = generation)}
    />
  </section>
  <ResultViewer generation={selected} onDeleted={handleDeleted} />
</div>

<style>
  .page {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(22rem, 0.8fr);
    gap: 1rem;
    align-items: start;
  }

  h1 {
    margin: 0 0 1rem;
  }

  @media (max-width: 980px) {
    .page {
      grid-template-columns: 1fr;
    }
  }
</style>
