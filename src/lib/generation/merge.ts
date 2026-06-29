import type { Generation } from '$lib/types/generation';

export function mergeGenerations(server: Generation[], optimistic: Generation[]): Generation[] {
  const merged = new Map<string, Generation>();

  for (const generation of server) {
    merged.set(generation.id, generation);
  }

  for (const generation of optimistic) {
    if (!merged.has(generation.id)) {
      merged.set(generation.id, generation);
    }
  }

  return [...merged.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function isPendingGeneration(generation: Generation) {
  return generation.status === 'queued' || generation.status === 'processing';
}
