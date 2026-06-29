import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { markGenerationFailed, runImageGenerationJob } from '../_shared/generation-job.ts';
import { buildHook, buildRecreatePrompt, buildThumbnailPrompt, mimeFromPath } from '../_shared/prompt.ts';
import { corsHeaders, json } from '../_shared/cors.ts';

type AssetPaths = {
  minecraft_skin?: string;
  face_photo?: string;
  game_screenshot?: string;
  source_thumbnail?: string;
};

type Payload = {
  stage?: 'create' | 'run' | 'fail' | 'recreate';
  generation_id?: string;
  error_message?: string;
  video_description?: string;
  custom_prompt?: string;
  video_link?: string;
  asset_paths?: AssetPaths;
  source_generation_id?: string;
};

const attachInputAssets = async (
  admin: ReturnType<typeof createClient>,
  userId: string,
  generationId: string,
  assetPaths: AssetPaths
) => {
  const inputAssets: Array<{ type: string; path: string }> = [];
  if (assetPaths.minecraft_skin) inputAssets.push({ type: 'minecraft_skin', path: assetPaths.minecraft_skin });
  if (assetPaths.face_photo) inputAssets.push({ type: 'face_photo', path: assetPaths.face_photo });
  if (assetPaths.game_screenshot) inputAssets.push({ type: 'game_screenshot', path: assetPaths.game_screenshot });

  for (const asset of inputAssets) {
    await admin.from('generation_assets').insert({
      generation_id: generationId,
      user_id: userId,
      asset_type: asset.type,
      storage_bucket: 'user-uploads',
      storage_path: asset.path,
      content_type: mimeFromPath(asset.path)
    });
  }
};

const startBackgroundGeneration = (
  admin: ReturnType<typeof createClient>,
  input: {
    userId: string;
    generationId: string;
    prompt: string;
    assetPaths: AssetPaths;
    openaiKey: string;
    imageModel: string;
    imageSize: string;
    imageQuality: string;
    creditCost: number;
  }
) => {
  EdgeRuntime.waitUntil(
    runImageGenerationJob({
      admin,
      userId: input.userId,
      generationId: input.generationId,
      prompt: input.prompt,
      assetPaths: input.assetPaths,
      openaiKey: input.openaiKey,
      imageModel: input.imageModel,
      imageSize: input.imageSize,
      imageQuality: input.imageQuality,
      creditCost: input.creditCost
    })
  );
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  const imageModel = Deno.env.get('IMAGE_MODEL') || 'gpt-image-1';
  const imageSize = Deno.env.get('IMAGE_SIZE') || '1536x1024';
  const imageQuality = Deno.env.get('IMAGE_QUALITY') || 'high';
  const creditCost = Number(Deno.env.get('GENERATION_CREDIT_COST') || '1');

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') || '' } }
  });
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user },
    error: userError
  } = await authClient.auth.getUser();

  if (userError || !user) return json({ error: 'Not authenticated' }, 401);

  const payload = (await req.json()) as Payload;
  const stage = payload.stage ?? (payload.generation_id ? 'run' : 'create');

  let videoDescription = payload.video_description?.trim() || '';
  const customPrompt = payload.custom_prompt?.trim() || '';
  const videoLink = payload.video_link?.trim() || '';
  let assetPaths: AssetPaths = { ...(payload.asset_paths || {}) };

  if (stage === 'recreate') {
    if (!payload.source_generation_id) {
      return json({ error: 'Missing source generation id.' }, 400);
    }
    if (!customPrompt) {
      return json({ error: 'Please describe how to modify the thumbnail.' }, 400);
    }

    const { data: sourceGeneration, error: sourceError } = await admin
      .from('generations')
      .select('video_description, output_image_path, status')
      .eq('id', payload.source_generation_id)
      .eq('user_id', user.id)
      .single();

    if (sourceError || !sourceGeneration) {
      return json({ error: 'Original generation not found.' }, 404);
    }

    if (sourceGeneration.status !== 'completed' || !sourceGeneration.output_image_path) {
      return json({ error: 'Original thumbnail must be completed before recreating.' }, 409);
    }

    videoDescription = sourceGeneration.video_description;

    const hasSkin = Boolean(assetPaths.minecraft_skin);
    const hasFace = Boolean(assetPaths.face_photo);
    const hasScreenshot = Boolean(assetPaths.game_screenshot);
    const prompt = buildRecreatePrompt({
      customPrompt,
      hasSkin,
      hasFace,
      hasScreenshot
    });

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('credits_remaining')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) return json({ error: 'Profile not found.' }, 404);
    if (profile.credits_remaining < creditCost) {
      return json({ error: "You're out of credits. Upgrade your plan to keep generating thumbnails." }, 402);
    }

    const { data: generation, error: insertError } = await admin
      .from('generations')
      .insert({
        user_id: user.id,
        status: 'processing',
        video_description: videoDescription,
        prompt,
        hook: buildHook(videoDescription),
        model: imageModel,
        image_size: imageSize,
        credit_cost: creditCost
      })
      .select()
      .single();

    if (insertError || !generation) return json({ error: 'Could not create generation.' }, 500);

    if (!openaiKey) {
      await markGenerationFailed(admin, generation.id, 'OPENAI_API_KEY is not configured.');
      return json({ error: 'OPENAI_API_KEY is not configured.' }, 500);
    }

    await attachInputAssets(admin, user.id, generation.id, assetPaths);

    startBackgroundGeneration(admin, {
      userId: user.id,
      generationId: generation.id,
      prompt,
      assetPaths: {
        ...assetPaths,
        source_thumbnail: sourceGeneration.output_image_path
      },
      openaiKey,
      imageModel,
      imageSize,
      imageQuality,
      creditCost
    });

    return json({
      started: true,
      generation: {
        ...generation,
        output_image_url: null
      }
    });
  }

  if (stage === 'create') {
    if (!videoDescription) {
      return json({ error: 'Please describe your video before generating.' }, 400);
    }
    if (videoDescription.length > 500) {
      return json({ error: 'Description is too long.' }, 400);
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('credits_remaining')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) return json({ error: 'Profile not found.' }, 404);
    if (profile.credits_remaining < creditCost) {
      return json({ error: "You're out of credits. Upgrade your plan to keep generating thumbnails." }, 402);
    }

    const hasSkin = Boolean(assetPaths.minecraft_skin);
    const hasFace = Boolean(assetPaths.face_photo);
    const hasScreenshot = Boolean(assetPaths.game_screenshot);
    const prompt = buildThumbnailPrompt({
      videoDescription,
      customPrompt,
      hasSkin,
      hasFace,
      hasScreenshot
    });

    const { data: generation, error: insertError } = await admin
      .from('generations')
      .insert({
        user_id: user.id,
        status: 'processing',
        video_description: videoDescription,
        prompt,
        hook: buildHook(videoDescription),
        model: imageModel,
        image_size: imageSize,
        credit_cost: creditCost
      })
      .select()
      .single();

    if (insertError || !generation) return json({ error: 'Could not create generation.' }, 500);

    return json({
      created: true,
      generation: {
        ...generation,
        output_image_url: null
      }
    });
  }

  if (stage === 'run') {
    if (!payload.generation_id) {
      return json({ error: 'Missing generation id.' }, 400);
    }

    const { data: generation, error: generationError } = await admin
      .from('generations')
      .select('*')
      .eq('id', payload.generation_id)
      .eq('user_id', user.id)
      .single();

    if (generationError || !generation) {
      return json({ error: 'Generation not found.' }, 404);
    }

    if (generation.status !== 'processing') {
      return json({ error: 'Generation is no longer pending.' }, 409);
    }

    if (!openaiKey) {
      await markGenerationFailed(admin, generation.id, 'OPENAI_API_KEY is not configured.');
      return json({ error: 'OPENAI_API_KEY is not configured.' }, 500);
    }

    await attachInputAssets(admin, user.id, generation.id, assetPaths);

    const hasSkin = Boolean(assetPaths.minecraft_skin);
    const hasFace = Boolean(assetPaths.face_photo);
    const hasScreenshot = Boolean(assetPaths.game_screenshot);
    const prompt = buildThumbnailPrompt({
      videoDescription: generation.video_description,
      customPrompt,
      hasSkin,
      hasFace,
      hasScreenshot
    });

    await admin.from('generations').update({ prompt }).eq('id', generation.id);

    startBackgroundGeneration(admin, {
      userId: user.id,
      generationId: generation.id,
      prompt,
      assetPaths,
      openaiKey,
      imageModel,
      imageSize,
      imageQuality,
      creditCost: generation.credit_cost
    });

    return json({
      started: true,
      generation: {
        ...generation,
        prompt,
        output_image_url: null
      }
    });
  }

  if (stage === 'fail') {
    if (!payload.generation_id) {
      return json({ error: 'Missing generation id.' }, 400);
    }

    const { data: generation, error: generationError } = await admin
      .from('generations')
      .select('id, status')
      .eq('id', payload.generation_id)
      .eq('user_id', user.id)
      .single();

    if (generationError || !generation) {
      return json({ error: 'Generation not found.' }, 404);
    }

    if (generation.status === 'processing' || generation.status === 'queued') {
      const message = payload.error_message?.trim() || 'Could not start generation.';
      await markGenerationFailed(admin, generation.id, message);
    }

    return json({ ok: true });
  }

  return json({ error: 'Invalid request.' }, 400);
});
