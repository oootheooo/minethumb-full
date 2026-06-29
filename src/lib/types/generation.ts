export type GenerationStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'deleted';

export type GenerationAssetType =
  | 'minecraft_skin'
  | 'face_photo'
  | 'game_screenshot'
  | 'generated_output';

export type Generation = {
  id: string;
  user_id: string;
  status: GenerationStatus;
  video_description: string;
  hook: string | null;
  prompt: string | null;
  output_image_path: string | null;
  output_image_url?: string | null;
  model: string | null;
  image_size: string | null;
  credit_cost: number;
  error_message: string | null;
  openai_response_id?: string | null;
  created_at: string;
  completed_at: string | null;
};

export const sampleGenerations: Generation[] = [
  {
    id: 'demo-1',
    user_id: 'demo',
    status: 'completed',
    video_description:
      'I built an automatic mud farm that bypasses dispenser delays with a torch trick.',
    hook: 'INSTANT MUD!',
    prompt: 'Minecraft mud farm thumbnail with bold block text and a glowing arrow.',
    output_image_path: '/images/demo-generated-thumbnail.svg',
    output_image_url: '/images/demo-generated-thumbnail.svg',
    model: 'gpt-image-1',
    image_size: '1536x1024',
    credit_cost: 1,
    error_message: null,
    created_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    completed_at: new Date(Date.now() - 1000 * 60 * 13).toISOString()
  },
  {
    id: 'demo-2',
    user_id: 'demo',
    status: 'processing',
    video_description: 'Surviving 100 days in a cave-only Minecraft world with no surface access.',
    hook: 'NO SUNLIGHT',
    prompt: null,
    output_image_path: null,
    model: 'gpt-image-1',
    image_size: '1536x1024',
    credit_cost: 1,
    error_message: null,
    created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    completed_at: null
  }
];
