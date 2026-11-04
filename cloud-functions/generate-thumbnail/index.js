import { createClient } from '@supabase/supabase-js';

const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 1_740_000);

const json = (res, status, body) => {
  res.status(status).set('Content-Type', 'application/json').send(JSON.stringify(body));
};

const mimeFromPath = (path) => {
  const lower = path.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/png';
};

const filenameFromPath = (path) => path.split('/').pop() || 'reference.png';

const formatOpenAIError = (errorText) => {
  try {
    const parsed = JSON.parse(errorText);
    return parsed?.error?.message || errorText;
  } catch {
    return errorText || 'OpenAI request failed.';
  }
};

const supportsInputFidelity = (model) => model === 'gpt-image-1' || model === 'gpt-image-1.5';

const decodeImageResponse = (payload) => {
  const b64 = payload.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('OpenAI did not return image data.');
  }

  return Uint8Array.from(Buffer.from(b64, 'base64'));
};

const generateImage = async (input) => {
  const { apiKey, model, prompt, size, quality, referenceImages, signal } = input;

  if (referenceImages?.length) {
    const form = new FormData();
    form.append('model', model);
    form.append('prompt', prompt);
    form.append('size', size);
    form.append('quality', quality);
    form.append('n', '1');

    if (supportsInputFidelity(model)) {
      form.append('input_fidelity', 'high');
    }

    for (const image of referenceImages) {
      form.append('image[]', new Blob([image.bytes], { type: image.mimeType }), image.filename);
    }

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal
    });

    if (!response.ok) {
      throw new Error(formatOpenAIError(await response.text()));
    }

    return decodeImageResponse(await response.json());
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      quality,
      response_format: 'b64_json',
      n: 1
    }),
    signal
  });

  if (!response.ok) {
    throw new Error(formatOpenAIError(await response.text()));
  }

  return decodeImageResponse(await response.json());
};

const downloadStorageImage = async (admin, bucket, storagePath) => {
  const { data, error } = await admin.storage.from(bucket).download(storagePath);
  if (error || !data) {
    throw new Error(`Could not load reference image: ${storagePath}`);
  }

  return {
    bytes: new Uint8Array(await data.arrayBuffer()),
    mimeType: mimeFromPath(storagePath),
    filename: filenameFromPath(storagePath)
  };
};

const markGenerationFailed = async (admin, generationId, message) => {
  await admin
    .from('generations')
    .update({ status: 'failed', error_message: message })
    .eq('id', generationId)
    .eq('status', 'processing');
};

const finalizeGeneration = async ({ admin, userId, generationId, imageBytes, creditCost }) => {
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

const runImageGenerationJob = async (input) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const referenceImages = [];

    if (input.assetPaths?.source_thumbnail) {
      referenceImages.push(
        await downloadStorageImage(input.admin, 'generated-thumbnails', input.assetPaths.source_thumbnail)
      );
    }

    if (input.assetPaths?.minecraft_skin) {
      referenceImages.push(await downloadStorageImage(input.admin, 'user-uploads', input.assetPaths.minecraft_skin));
    }
    if (input.assetPaths?.face_photo) {
      referenceImages.push(await downloadStorageImage(input.admin, 'user-uploads', input.assetPaths.face_photo));
    }
    if (input.assetPaths?.game_screenshot) {
      referenceImages.push(await downloadStorageImage(input.admin, 'user-uploads', input.assetPaths.game_screenshot));
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

export const generateThumbnail = async (req, res) => {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const expectedSecret = process.env.GENERATION_WORKER_SECRET;
  const requestSecret = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!expectedSecret || requestSecret !== expectedSecret) {
    return json(res, 401, { error: 'Not authorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !serviceRoleKey || !openaiKey) {
    return json(res, 500, { error: 'Worker is not configured.' });
  }

  const payload = req.body || {};
  const required = ['userId', 'generationId', 'prompt', 'imageModel', 'imageSize', 'imageQuality', 'creditCost'];
  const missing = required.filter((key) => payload[key] === undefined || payload[key] === null || payload[key] === '');
  if (missing.length) {
    return json(res, 400, { error: `Missing required field: ${missing[0]}` });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: generation, error: generationError } = await admin
    .from('generations')
    .select('id, user_id, status')
    .eq('id', payload.generationId)
    .single();

  if (generationError || !generation) {
    return json(res, 404, { error: 'Generation not found.' });
  }

  if (generation.user_id !== payload.userId) {
    return json(res, 403, { error: 'Generation owner mismatch.' });
  }

  if (generation.status !== 'processing') {
    return json(res, 409, { error: 'Generation is no longer pending.' });
  }

  await runImageGenerationJob({
    admin,
    userId: payload.userId,
    generationId: payload.generationId,
    prompt: payload.prompt,
    assetPaths: payload.assetPaths || {},
    openaiKey,
    imageModel: payload.imageModel,
    imageSize: payload.imageSize,
    imageQuality: payload.imageQuality,
    creditCost: Number(payload.creditCost)
  });

  return json(res, 200, { ok: true });
};
