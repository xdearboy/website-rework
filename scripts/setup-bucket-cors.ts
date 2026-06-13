import { PutBucketCorsCommand, S3Client } from '@aws-sdk/client-s3';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

const s3 = new S3Client({
  region: process.env.S3_REGION || 'ru-central1',
  endpoint: requireEnv('S3_ENDPOINT'),
  forcePathStyle: true,
  credentials: {
    accessKeyId: requireEnv('S3_ACCESS_KEY_ID'),
    secretAccessKey: requireEnv('S3_SECRET_ACCESS_KEY'),
  },
});

const bucket = requireEnv('S3_BUCKET');

async function main() {
  await s3.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: ['*'],
            AllowedHeaders: ['*'],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    })
  );
  console.log(`CORS configured for bucket ${bucket}`);
}

main().catch((err) => {
  console.error('Failed to configure CORS:', err);
  process.exit(1);
});
