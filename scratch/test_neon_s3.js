import "dotenv/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.NEON_STORAGE_BUCKET || "bantuin-assets";

async function test(regionName) {
  console.log(`Testing region: ${regionName}`);
  try {
    const client = new S3Client({
      endpoint,
      region: regionName,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `test-${Date.now()}.txt`,
      Body: Buffer.from("Hello Neon Storage!"),
      ContentType: "text/plain",
    });

    const res = await client.send(command);
    console.log(` SUCCESS with region "${regionName}"!`, res);
  } catch (e) {
    console.error(` FAILED with region "${regionName}":`, e.message);
  }
}

async function main() {
  await test("auto");
  await test("us-east-2");
}

main();
