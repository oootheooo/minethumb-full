import { env } from '$env/dynamic/public';
import { createSupabaseBrowserClient } from '$lib/supabase/client';
import type { Generation } from '$lib/types/generation';

type AssetPaths = {
  minecraft_skin?: string;
  face_photo?: string;
  game_screenshot?: string;
};

type CreateGenerationResponse = {
  generation?: Generation;
  error?: string;
  detail?: string;
};

const allowedImageTypes = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

const mimeFromFile = (file: File) => {
  if (file.type && allowedImageTypes.has(file.type)) {
    return file.type === 'image/jpg' ? 'image/jpeg' : file.type;
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';

  return null;
};

const uploadAsset = async (file: File, userId: string) => {
  const contentType = mimeFromFile(file);
  if (!contentType) {
    throw new Error('Upload PNG, JPG, or WEBP images only.');
  }

  const supabase = createSupabaseBrowserClient();
  const safeName = file.name.replace(/[^\w.-]+/g, '-');
  const path = `${userId}/${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage.from('user-uploads').upload(path, file, {
    contentType,
    upsert: false
  });

  if (error) {
    throw new Error(error.message || 'Could not upload image.');
  }

  return path;
};

const callGenerationFunction = async (
  body: Record<string, unknown>,
  options?: { expectGeneration?: boolean }
) => {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('You must be logged in to generate.');
  }

  const baseUrl = env.PUBLIC_SUPABASE_URL;
  const anonKey = env.PUBLIC_SUPABASE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    throw new Error('Supabase is not configured.');
  }

  const response = await fetch(`${baseUrl}/functions/v1/create-thumbnail-generation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify(body)
  });

  const payload = (await response.json()) as CreateGenerationResponse;

  if (!response.ok) {
    throw new Error(payload.detail || payload.error || 'Could not start generation.');
  }

  if (options?.expectGeneration === false) {
    return null;
  }

  if (!payload.generation) {
    throw new Error('Generation response missing from server.');
  }

  return payload.generation;
};

export async function createThumbnailGeneration(input: {
  videoDescription: string;
  customPrompt?: string;
  videoLink?: string;
  skin?: File | null;
  face?: File | null;
  referenceImage?: File | null;
  onCreated?: (generation: Generation) => void;
}) {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('You must be logged in to generate.');
  }

  const generation = await callGenerationFunction({
    stage: 'create',
    video_description: input.videoDescription.trim(),
    custom_prompt: input.customPrompt?.trim() || undefined,
    video_link: input.videoLink?.trim() || undefined
  });

  input.onCreated?.(generation);

  const asset_paths: AssetPaths = {};

  try {
    if (input.skin) {
      asset_paths.minecraft_skin = await uploadAsset(input.skin, session.user.id);
    }
    if (input.face) {
      asset_paths.face_photo = await uploadAsset(input.face, session.user.id);
    }
    if (input.referenceImage) {
      asset_paths.game_screenshot = await uploadAsset(input.referenceImage, session.user.id);
    }

    await callGenerationFunction({
      stage: 'run',
      generation_id: generation.id,
      video_link: input.videoLink?.trim() || undefined,
      custom_prompt: input.customPrompt?.trim() || undefined,
      asset_paths: Object.keys(asset_paths).length ? asset_paths : undefined
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not start generation.';

    try {
      await callGenerationFunction(
        {
          stage: 'fail',
          generation_id: generation.id,
          error_message: message
        },
        { expectGeneration: false }
      );
    } catch {
      // Best-effort; stale cleanup will catch rows left in processing.
    }

    throw error;
  }

  return generation;
}

export async function recreateThumbnailGeneration(input: {
  sourceGenerationId: string;
  customPrompt: string;
  skin?: File | null;
  face?: File | null;
  referenceImage?: File | null;
  onCreated?: (generation: Generation) => void;
}) {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('You must be logged in to generate.');
  }

  const customPrompt = input.customPrompt.trim();
  if (!customPrompt) {
    throw new Error('Please describe how to modify the thumbnail.');
  }

  const asset_paths: AssetPaths = {};

  if (input.skin) {
    asset_paths.minecraft_skin = await uploadAsset(input.skin, session.user.id);
  }
  if (input.face) {
    asset_paths.face_photo = await uploadAsset(input.face, session.user.id);
  }
  if (input.referenceImage) {
    asset_paths.game_screenshot = await uploadAsset(input.referenceImage, session.user.id);
  }

  const generation = await callGenerationFunction({
    stage: 'recreate',
    source_generation_id: input.sourceGenerationId,
    custom_prompt: customPrompt,
    asset_paths: Object.keys(asset_paths).length ? asset_paths : undefined
  });

  input.onCreated?.(generation);
  return generation;
}

export async function softDeleteGeneration(generationId: string) {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('You must be logged in.');
  }

  const generationsTable = supabase.from('generations') as ReturnType<typeof supabase.from>;

  const { error } = await generationsTable
    .update({ status: 'deleted' })
    .eq('id', generationId)
    .eq('user_id', session.user.id);

  if (error) {
    throw new Error(error.message || 'Could not delete generation.');
  }
}

export async function downloadGenerationImage(generation: Generation) {
  const url = generation.output_image_url || generation.output_image_path;
  if (!url) return;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Could not download image.');
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `${generation.hook || 'minethumb-thumbnail'}.png`.replace(/[^\w.-]+/g, '-');
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
