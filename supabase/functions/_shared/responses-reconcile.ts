import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import {
  describeOpenAIResponseFailure,
  extractImageBytesFromResponse,
  isPendingOpenAIStatus,
  retrieveOpenAIResponse
} from './openai.ts';
import { finalizeGeneration, markGenerationFailed } from './generation-job.ts';

type ReconcileGenerationInput = {
  admin: SupabaseClient;
  userId: string;
  generationId: string;
  openaiResponseId: string;
  openaiKey: string;
  creditCost: number;
};

/** Legacy reconcile for rows created via the old Responses API path. */
export const reconcileGeneration = async (input: ReconcileGenerationInput): Promise<boolean> => {
  const { admin, userId, generationId, openaiResponseId, openaiKey, creditCost } = input;

  const payload = await retrieveOpenAIResponse(openaiKey, openaiResponseId);

  if (isPendingOpenAIStatus(payload.status)) {
    return false;
  }

  if (payload.status === 'completed') {
    const imageBytes = extractImageBytesFromResponse(payload);
    await finalizeGeneration({
      admin,
      userId,
      generationId,
      imageBytes,
      creditCost
    });
    return true;
  }

  await markGenerationFailed(admin, generationId, describeOpenAIResponseFailure(payload));
  return true;
};
