import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '@/lib/env';

function getR2Client() {
  if (!env.R2_ENDPOINT || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) return null;

  return new S3Client({
    region: 'auto',
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY
    }
  });
}

export async function uploadCertificatePdf(key: string, body: Buffer) {
  const client = getR2Client();
  if (!client || !env.R2_BUCKET_NAME) return null;

  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: 'application/pdf',
      CacheControl: 'private, max-age=31536000, immutable'
    })
  );

  if (!env.R2_PUBLIC_URL) return null;
  return `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
}
