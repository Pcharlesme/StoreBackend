import crypto from "crypto";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials:
    env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

// ===== Upload / Delete =====

/**
 * Stores the file under a random key and returns the key (not a URL).
 * The bucket stays private; clients only ever receive short-lived signed URLs.
 */
export async function uploadImage(file: Express.Multer.File): Promise<string> {
  // The original filename is user-controlled, so it never ends up in the key.
  const extension = EXTENSION_BY_MIME[file.mimetype] ?? "bin";
  const key = `listings/${crypto.randomUUID()}.${extension}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return key;
}

export async function deleteImages(keys: string[]): Promise<void> {
  // DeleteObjects accepts at most 1000 keys per request
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: env.AWS_S3_BUCKET,
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }
}

/** Cleanup that must never fail the request: orphaned objects are logged, not thrown. */
export async function deleteImagesSafely(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    await deleteImages(keys);
  } catch (error) {
    console.error(`Failed to delete ${keys.length} S3 object(s):`, error);
  }
}

// ===== Signed URLs =====

export function getImageUrl(key: string): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key }), {
    expiresIn: SIGNED_URL_TTL_SECONDS,
  });
}

/** Replaces stored S3 keys with signed URLs. Signing happens locally, no network round trip. */
export async function withSignedImageUrls<T extends { images?: string[] }>(listing: T): Promise<T> {
  return {
    ...listing,
    images: await Promise.all((listing.images ?? []).map(getImageUrl)),
  };
}
