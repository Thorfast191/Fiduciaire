import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

const SIGNED_URL_TTL_SECONDS = 5 * 60;

// Path-style addressing (bucket in the URL path, not a subdomain) is
// required for MinIO and works identically against Infomaniak Object
// Storage — this is what makes the same client code work against both.
const client = new S3Client({
  endpoint: env.STORAGE_ENDPOINT,
  region: env.STORAGE_REGION,
  credentials: {
    accessKeyId: env.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

export async function getUploadUrl(
  key: string,
  mimeType: string,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.STORAGE_BUCKET,
    Key: key,
    ContentType: mimeType,
  });
  return getSignedUrl(client, command, { expiresIn: SIGNED_URL_TTL_SECONDS });
}

export async function getDownloadUrl(
  key: string,
  filename: string,
): Promise<string> {
  // RFC 6266: filename="..." is an ASCII-only fallback for older clients;
  // filename*=UTF-8''... is what modern browsers actually use, so accented
  // characters (common in French filenames — "Déclaration", "Relevé")
  // download correctly instead of as mojibake, and embedded quotes can't
  // spoof a second filename parameter.
  const asciiFallback = filename
    .replace(/[^\x20-\x7e]/g, "_")
    .replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(filename);
  const command = new GetObjectCommand({
    Bucket: env.STORAGE_BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`,
  });
  return getSignedUrl(client, command, { expiresIn: SIGNED_URL_TTL_SECONDS });
}

export interface ObjectMetadata {
  contentLength: number;
  contentType: string;
}

/**
 * The object's real size and type as stored, not what the uploader claimed.
 *
 * A presigned PUT does not bind Content-Length, and the Content-Type it signs
 * is not enforced by every S3-compatible backend, so the values recorded when
 * the upload was requested cannot be trusted. Returns null when the object is
 * absent.
 */
export async function getObjectMetadata(
  key: string,
): Promise<ObjectMetadata | null> {
  try {
    const head = await client.send(
      new HeadObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: key }),
    );
    return {
      contentLength: head.ContentLength ?? 0,
      contentType: head.ContentType ?? "application/octet-stream",
    };
  } catch (err) {
    const name = (err as { name?: string }).name;
    if (name === "NotFound" || name === "NoSuchKey") return null;
    throw err;
  }
}

export async function objectExists(key: string): Promise<boolean> {
  return (await getObjectMetadata(key)) !== null;
}

export async function deleteObject(key: string): Promise<void> {
  await client.send(
    new DeleteObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: key }),
  );
}
