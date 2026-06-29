import { getContext } from 'svelte';
import type { Generation } from '$lib/types/generation';

export const GENERATIONS_KEY = Symbol('generations');

export type GenerationsContext = {
  readonly current: Generation[];
  readonly totalCount: number;
  readonly hasMore: boolean;
  readonly loadingMore: boolean;
  replace: (next: Generation[]) => void;
  applyRow: (row: Generation) => Promise<void>;
  removeById: (generationId: string) => void;
  loadMore: () => Promise<void>;
};

export function getGenerationsContext(): GenerationsContext {
  return getContext<GenerationsContext>(GENERATIONS_KEY);
}
