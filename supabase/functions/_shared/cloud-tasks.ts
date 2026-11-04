type ServiceAccountCredentials = {
  project_id: string;
  client_email: string;
  private_key: string;
};

type AssetPaths = {
  minecraft_skin?: string;
  face_photo?: string;
  game_screenshot?: string;
  source_thumbnail?: string;
};

type EnqueueGenerationTaskInput = {
  userId: string;
  generationId: string;
  prompt: string;
  assetPaths: AssetPaths;
  imageModel: string;
  imageSize: string;
  imageQuality: string;
  creditCost: number;
};

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

const textEncoder = new TextEncoder();

const base64UrlEncode = (input: string | Uint8Array) => {
  const bytes = typeof input === 'string' ? textEncoder.encode(input) : input;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const base64Encode = (input: string) => {
  const bytes = textEncoder.encode(input);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const pemToArrayBuffer = (pem: string) => {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
};

const getCredentials = (): ServiceAccountCredentials => {
  const raw = Deno.env.get('GOOGLE_CLOUD_TASKS_SERVICE_ACCOUNT_JSON');
  if (!raw) {
    throw new Error('GOOGLE_CLOUD_TASKS_SERVICE_ACCOUNT_JSON is not configured.');
  }

  return JSON.parse(raw) as ServiceAccountCredentials;
};

const getAccessToken = async () => {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }

  const credentials = getCredentials();
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const unsignedJwt = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claim))}`;
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(credentials.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, textEncoder.encode(unsignedJwt)));
  const jwt = `${unsignedJwt}.${base64UrlEncode(signature)}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!response.ok) {
    throw new Error(`Could not authenticate with Google Cloud Tasks: ${await response.text()}`);
  }

  const payload = (await response.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = {
    token: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000
  };

  return cachedAccessToken.token;
};

export const enqueueGenerationTask = async (input: EnqueueGenerationTaskInput) => {
  const projectId = Deno.env.get('GOOGLE_CLOUD_TASKS_PROJECT_ID');
  const location = Deno.env.get('GOOGLE_CLOUD_TASKS_LOCATION') || 'us-central1';
  const queue = Deno.env.get('GOOGLE_CLOUD_TASKS_QUEUE') || 'thumbnail-generation';
  const workerUrl = Deno.env.get('GOOGLE_GENERATION_FUNCTION_URL');
  const workerSecret = Deno.env.get('GOOGLE_GENERATION_FUNCTION_SECRET');

  if (!projectId || !workerUrl || !workerSecret) {
    throw new Error('Google generation worker is not configured.');
  }

  const token = await getAccessToken();
  const url = `https://cloudtasks.googleapis.com/v2/projects/${projectId}/locations/${location}/queues/${queue}/tasks`;
  const body = {
    task: {
      dispatchDeadline: '1800s',
      httpRequest: {
        httpMethod: 'POST',
        url: workerUrl,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${workerSecret}`
        },
        body: base64Encode(JSON.stringify(input))
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Could not enqueue generation task: ${await response.text()}`);
  }
};
