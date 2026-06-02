import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// S3 només està actiu si hi ha credencials + bucket configurats
export function s3Configurat(): boolean {
  return !!(process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY && process.env.S3_BUCKET && process.env.S3_ENDPOINT);
}

export const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || "https://fsn1.your-objectstorage.com",
  region: process.env.S3_REGION || "eu-central",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
  forcePathStyle: true,
  // Si està mal configurat, que falli ràpid (no 20s de reintents)
  maxAttempts: 2,
  requestHandler: { requestTimeout: 8000, connectionTimeout: 4000 } as any,
});

export async function pujarFoto(
  buffer: Buffer,
  nomFitxer: string,
  contentType: string
): Promise<string> {
  const bucket = process.env.S3_BUCKET!;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: nomFitxer,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return `${process.env.S3_ENDPOINT}/${bucket}/${nomFitxer}`;
}

export async function obtenirUrlFirmada(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET || "residus-fotos",
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
