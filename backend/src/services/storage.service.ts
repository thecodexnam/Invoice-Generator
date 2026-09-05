import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomToken } from '../utils/tokenCompare.js';
import { env } from '../config/env.js';
import { badRequest } from '../utils/AppError.js';

const ALLOWED_CONTENT_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
const MAX_BYTES = 2 * 1024 * 1024; // 2MB declared intent; storage provider enforces

function storageConfigured(): boolean {
  return Boolean(
    env.OBJECT_STORAGE_BUCKET && env.OBJECT_STORAGE_ACCESS_KEY && env.OBJECT_STORAGE_SECRET_KEY,
  );
}

function getClient(): S3Client {
  return new S3Client({
    region: env.OBJECT_STORAGE_REGION,
    endpoint: env.OBJECT_STORAGE_ENDPOINT || undefined,
    forcePathStyle: Boolean(env.OBJECT_STORAGE_ENDPOINT),
    credentials: {
      accessKeyId: env.OBJECT_STORAGE_ACCESS_KEY,
      secretAccessKey: env.OBJECT_STORAGE_SECRET_KEY,
    },
  });
}

export async function createPresignedUpload(input: {
  userId: string;
  contentType: string;
  purpose: 'logo' | 'signature';
  contentLength: number;
}): Promise<{ uploadUrl: string; publicUrl: string; key: string; expiresIn: number }> {
  if (!ALLOWED_CONTENT_TYPES.has(input.contentType)) {
    throw badRequest('Unsupported content type');
  }
  if (input.contentLength <= 0 || input.contentLength > MAX_BYTES) {
    throw badRequest(`File must be between 1 byte and ${MAX_BYTES} bytes`);
  }

  const ext = input.contentType.split('/')[1]?.replace('svg+xml', 'svg') || 'bin';
  const key = `users/${input.userId}/${input.purpose}/${randomToken(16)}.${ext}`;
  const expiresIn = 600;

  if (!storageConfigured()) {
    const publicUrl = `${env.CLIENT_URL}/dev-uploads/${key}`;
    return {
      uploadUrl: `${env.CLIENT_URL}/dev-uploads/presign-stub`,
      publicUrl,
      key,
      expiresIn,
    };
  }

  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: env.OBJECT_STORAGE_BUCKET,
    Key: key,
    ContentType: input.contentType,
    ContentLength: input.contentLength,
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  const publicBase =
    env.OBJECT_STORAGE_PUBLIC_BASE_URL ||
    (env.OBJECT_STORAGE_ENDPOINT
      ? `${env.OBJECT_STORAGE_ENDPOINT.replace(/\/$/, '')}/${env.OBJECT_STORAGE_BUCKET}`
      : `https://${env.OBJECT_STORAGE_BUCKET}.s3.${env.OBJECT_STORAGE_REGION}.amazonaws.com`);
  const publicUrl = `${publicBase.replace(/\/$/, '')}/${key}`;

  return { uploadUrl, publicUrl, key, expiresIn };
}
