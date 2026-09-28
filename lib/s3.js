import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || "us-east-2";
const bucketName = process.env.NEON_STORAGE_BUCKET || "bantuin-assets";

export const s3Client = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
  forcePathStyle: true,
});

/**
 * Upload buffer to Neon S3-compatible storage
 * @param {Object} params
 * @param {Buffer} params.buffer
 * @param {string} params.filename
 * @param {string} params.contentType
 * @param {string} [params.folder] - e.g. 'requests', 'avatars', 'proofs'
 */
export async function uploadToNeonStorage({ buffer, filename, contentType, folder = "requests" }) {
  const ext = filename ? filename.split(".").pop() : "jpg";
  const sanitizedName = (filename ? filename.replace(/[^a-zA-Z0-9.-]/g, "_") : "file");
  const uniqueKey = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${sanitizedName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: uniqueKey,
    Body: buffer,
    ContentType: contentType || "image/jpeg",
  });

  await s3Client.send(command);

  // Construct standard public URL for public bucket
  const cleanEndpoint = endpoint?.replace(/\/+$/, "") || "";
  const publicUrl = `${cleanEndpoint}/${bucketName}/${uniqueKey}`;

  return {
    key: uniqueKey,
    url: publicUrl,
    bucket: bucketName,
  };
}
