export const buildThumbnailPrompt = (input: {
  videoDescription: string;
  customPrompt?: string;
  hasSkin: boolean;
  hasFace: boolean;
  hasScreenshot: boolean;
}) => {
  const lines = [
    'I have a Minecraft YouTube channel and I want you to create a thumbnail for a video that I will or have uploaded.',
    '',
    `Here is my video description: ${input.videoDescription}`
  ];

  if (input.hasSkin) {
    lines.push('', 'Here is a reference photo of my Minecraft skin to use in the thumbnail.');
  }

  if (input.hasScreenshot) {
    lines.push(
      '',
      'Here is a reference photo of what I did in the video. Use that reference photo to showcase or show any builds, activities as basis or focal point for the thumbnail.'
    );
  }

  if (input.hasFace) {
    lines.push(
      '',
      'Here is my face, to be included as a reactionary headcam-style part of the thumbnail. Make sure emotions is accurately portrayed based on the description of what I did in the video.'
    );
  }

  if (input.customPrompt?.trim()) {
    lines.push(
      '',
      `For more exact direction, incorporate the thoughts I have on how the thumbnail should look: "${input.customPrompt.trim()}"`
    );
  }

  lines.push(
    '',
    'Create an enticing thumbnail that hooks the attention of people based on the reference video description, texts and images.'
  );

  return lines.join('\n');
};

export const buildRecreatePrompt = (input: {
  customPrompt: string;
  hasSkin: boolean;
  hasFace: boolean;
  hasScreenshot: boolean;
}) => {
  const lines = [
    'I have a Minecraft YouTube channel and you have already created a thumbnail for a video that I made.',
    '',
    'Here is the thumbnail you created: {the image chatgpt previously created}',
    '',
    "I want you to modify that thumbnail because it's not quite what I want. Follow these instructions:",
    input.customPrompt.trim()
  ];

  if (input.hasSkin) {
    lines.push(
      '',
      'Here is a reference photo of my Minecraft skin for reference. Use it to modify the thumbnail based on my instructions.'
    );
  }

  if (input.hasScreenshot) {
    lines.push(
      '',
      'Here is a reference photo of what I did in the video. Use it to modify the thumbnail based on my instructions.'
    );
  }

  if (input.hasFace) {
    lines.push(
      '',
      'Here is my face, to be included as a reactionary headcam-style part of the thumbnail. Make sure emotions is accurately portrayed based on the description of what I did in the video. Use it based on my instructions.'
    );
  }

  lines.push(
    '',
    'Create an enticing thumbnail that hooks the attention of people based on my instructions.'
  );

  return lines.join('\n');
};

export const buildHook = (description: string) => {
  const text = description.toLowerCase();
  if (text.includes('mud')) return 'INSTANT MUD!';
  if (text.includes('farm')) return 'FASTEST FARM?';
  if (text.includes('100 days')) return '100 DAYS';
  if (text.includes('diamond')) return 'DIAMONDS!';
  if (text.includes('enderman')) return 'ENDERMAN!';
  if (text.includes('space')) return 'SPACE BASE!';
  return 'WATCH THIS!';
};

export const mimeFromPath = (path: string) => {
  const lower = path.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/png';
};

export const filenameFromPath = (path: string) => path.split('/').pop() || 'reference.png';
