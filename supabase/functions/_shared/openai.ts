type ReferenceImage = {
  bytes: Uint8Array;
  mimeType: string;
  filename: string;
};

const OPENAI_TIMEOUT_MS = 180_000;

type GenerateImageInput = {
  apiKey: string;
  model: string;
  prompt: string;
  size: string;
  quality: string;
  referenceImages?: ReferenceImage[];
  signal?: AbortSignal;
};

export const formatOpenAIError = (errorText: string): string => {
  try {
    const parsed = JSON.parse(errorText) as { error?: { message?: string } };
    return parsed?.error?.message || errorText;
  } catch {
    return errorText || 'OpenAI request failed.';
  }
};

const supportsInputFidelity = (model: string) =>
  model === 'gpt-image-1' || model === 'gpt-image-1.5';

export const decodeImageResponse = (payload: { data?: Array<{ b64_json?: string }> }): Uint8Array => {
  const b64 = payload.data?.[0]?.b64_json;

  if (!b64) {
    throw new Error('OpenAI did not return image data.');
  }

  return Uint8Array.from(atob(b64), (char) => char.charCodeAt(0));
};

/** Direct OpenAI Images API — /v1/images/generations or /v1/images/edits. */
export const generateImage = async (input: GenerateImageInput): Promise<Uint8Array> => {
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
      form.append(
        'image[]',
        new Blob([image.bytes], { type: image.mimeType }),
        image.filename
      );
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

export type OpenAIResponsePayload = {
  id: string;
  status: string;
  error?: { message?: string } | null;
  output?: Array<{
    type: string;
    status?: string;
    result?: string | null;
  }>;
};

export const isPendingOpenAIStatus = (status: string) =>
  status === 'queued' || status === 'in_progress';

export const retrieveOpenAIResponse = async (
  apiKey: string,
  responseId: string
): Promise<OpenAIResponsePayload> => {
  const response = await fetch(`https://api.openai.com/v1/responses/${responseId}`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    throw new Error(formatOpenAIError(await response.text()));
  }

  return response.json();
};

export const extractImageBytesFromResponse = (payload: OpenAIResponsePayload): Uint8Array => {
  const imageCall = payload.output?.find(
    (item) => item.type === 'image_generation_call' && item.status === 'completed' && item.result
  );

  if (imageCall?.result) {
    return Uint8Array.from(atob(imageCall.result), (char) => char.charCodeAt(0));
  }

  throw new Error('OpenAI did not return image data.');
};

export const describeOpenAIResponseFailure = (payload: OpenAIResponsePayload): string => {
  if (payload.error?.message) return payload.error.message;
  if (payload.status === 'cancelled') return 'Generation was cancelled.';
  if (payload.status === 'incomplete') return 'Generation did not finish completely.';
  return 'Image generation failed.';
};
