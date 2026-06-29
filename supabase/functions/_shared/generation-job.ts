import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { generateImage } from './openai.ts';
import { filenameFromPath, mimeFromPath } from './prompt.ts';

type AssetPaths = {
  minecraft_skin?: string;
  face_photo?: string;
  game_screenshot?: string;
  source_thumbnail?: string;
};

const OPENAI_TIMEOUT_MS = 180_000;

type RunImageGenerationJobInput = {
  admin: SupabaseClient;
  userId: string;
  generationId: string;
  prompt: string;
  assetPaths: AssetPaths;
  openaiKey: string;
  imageModel: string;
  imageSize: string;
  imageQuality: string;
  creditCost: number;
};

type FinalizeGenerationInput = {
  admin: SupabaseClient;
  userId: string;
  generationId: string;
  imageBytes: Uint8Array;
  creditCost: number;
};

const downloadReferenceImage = async (admin: SupabaseClient, storagePath: string) => {
  const { data, error } = await admin.storage.from('user-uploads').download(storagePath);
  if (error || !data) {
    throw new Error(`Could not load reference image: ${storagePath}`);
  }

  const bytes = new Uint8Array(await data.arrayBuffer());
  return {
    bytes,
    mimeType: mimeFromPath(storagePath),
    filename: filenameFromPath(storagePath)
  };
};

const downloadGeneratedThumbnail = async (admin: SupabaseClient, storagePath: string) => {
  const { data, error } = await admin.storage.from('generated-thumbnails').download(storagePath);
  if (error || !data) {
    throw new Error(`Could not load source thumbnail: ${storagePath}`);
  }

  const bytes = new Uint8Array(await data.arrayBuffer());
  return {
    bytes,
    mimeType: mimeFromPath(storagePath),
    filename: filenameFromPath(storagePath)
  };
};

export const finalizeGeneration = async (input: FinalizeGenerationInput) => {
  const { admin, userId, generationId, imageBytes, creditCost } = input;

  const { data: generation, error: generationError } = await admin
    .from('generations')
    .select('status')
    .eq('id', generationId)
    .single();

  if (generationError || !generation || generation.status !== 'processing') {
    return;
  }

  const outputPath = `${userId}/${generationId}/thumbnail.png`;

  const { error: uploadError } = await admin.storage
    .from('generated-thumbnails')
    .upload(outputPath, imageBytes, { contentType: 'image/png', upsert: true });

  if (uploadError) throw uploadError;

  await admin.from('generation_assets').insert({
    generation_id: generationId,
    user_id: userId,
    asset_type: 'generated_output',
    storage_bucket: 'generated-thumbnails',
    storage_path: outputPath,
    content_type: 'image/png'
  });

  const { data: completedRow, error: updateError } = await admin
    .from('generations')
    .update({
      status: 'completed',
      output_image_path: outputPath,
      completed_at: new Date().toISOString()
    })
    .eq('id', generationId)
    .eq('status', 'processing')
    .select('id')
    .maybeSingle();

  if (updateError) throw updateError;
  if (!completedRow) return;

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('credits_remaining, generations_this_period')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    throw new Error('Profile not found while finalizing generation.');
  }

  if (profile.credits_remaining < creditCost) {
    throw new Error('Not enough credits to finalize generation.');
  }

  await admin
    .from('profiles')
    .update({
      credits_remaining: profile.credits_remaining - creditCost,
      generations_this_period: (profile.generations_this_period || 0) + 1
    })
    .eq('id', userId);

  await admin.from('credit_ledger').insert({
    user_id: userId,
    generation_id: generationId,
    amount: -creditCost,
    reason: 'thumbnail_generation'
  });
};

export const markGenerationFailed = async (
  admin: SupabaseClient,
  generationId: string,
  message: string
) => {
  await admin
    .from('generations')
    .update({ status: 'failed', error_message: message })
    .eq('id', generationId)
    .eq('status', 'processing');
};

export const runImageGenerationJob = async (input: RunImageGenerationJobInput) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const referenceImages = [];

    if (input.assetPaths.source_thumbnail) {
      referenceImages.push(
        await downloadGeneratedThumbnail(input.admin, input.assetPaths.source_thumbnail)
      );
    }

    if (input.assetPaths.minecraft_skin) {
      referenceImages.push(await downloadReferenceImage(input.admin, input.assetPaths.minecraft_skin));
    }
    if (input.assetPaths.face_photo) {
      referenceImages.push(await downloadReferenceImage(input.admin, input.assetPaths.face_photo));
    }
    if (input.assetPaths.game_screenshot) {
      referenceImages.push(await downloadReferenceImage(input.admin, input.assetPaths.game_screenshot));
    }

    const imageBytes = await generateImage({
      apiKey: input.openaiKey,
      model: input.imageModel,
      prompt: input.prompt,
      size: input.imageSize,
      quality: input.imageQuality,
      referenceImages: referenceImages.length ? referenceImages : undefined,
      signal: controller.signal
    });

    await finalizeGeneration({
      admin: input.admin,
      userId: input.userId,
      generationId: input.generationId,
      imageBytes,
      creditCost: input.creditCost
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'Image generation timed out before completing. Your credit was not used.'
        : error instanceof Error
          ? error.message
          : 'Could not generate image.';

    console.error(`Generation ${input.generationId} failed:`, message);
    await markGenerationFailed(input.admin, input.generationId, message);
  } finally {
    clearTimeout(timeout);
  }
};
