import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as fs from "fs";
import * as path from "path";

/**
 * S3 Upload utility for video storage
 * Handles uploading self-tape videos to AWS S3
 */

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "filmcontract-videos";
const EXPIRATION_HOURS = 24; // Presigned URLs expire after 24 hours

/**
 * Upload a video file to S3
 * @param fileUri - Local file URI or path
 * @param fileName - Name for the file in S3
 * @param selfTapeId - Self-tape ID for organizing files
 * @returns S3 URL of the uploaded file
 */
export async function uploadVideoToS3(
  fileUri: string,
  fileName: string,
  selfTapeId: number
): Promise<{ url: string; key: string }> {
  try {
    // Read file from local storage
    const fileBuffer = fs.readFileSync(fileUri);

    // Create S3 key with folder structure
    const timestamp = Date.now();
    const s3Key = `self-tapes/${selfTapeId}/${timestamp}-${fileName}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: "video/mp4",
      Metadata: {
        selfTapeId: selfTapeId.toString(),
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    // Generate presigned URL for access
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    const presignedUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: EXPIRATION_HOURS * 3600,
    });

    return {
      url: presignedUrl,
      key: s3Key,
    };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(`Failed to upload video to S3: ${error}`);
  }
}

/**
 * Generate a new presigned URL for an existing S3 object
 * @param s3Key - S3 object key
 * @returns New presigned URL
 */
export async function getPresignedUrl(s3Key: string): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: EXPIRATION_HOURS * 3600,
    });

    return presignedUrl;
  } catch (error) {
    console.error("Presigned URL generation error:", error);
    throw new Error(`Failed to generate presigned URL: ${error}`);
  }
}

/**
 * Delete a video from S3
 * @param s3Key - S3 object key
 */
export async function deleteVideoFromS3(s3Key: string): Promise<void> {
  try {
    // Note: Implement using DeleteObjectCommand if needed
    console.log(`Video deletion not yet implemented for key: ${s3Key}`);
  } catch (error) {
    console.error("S3 delete error:", error);
    throw new Error(`Failed to delete video from S3: ${error}`);
  }
}

/**
 * Check if S3 credentials are configured
 */
export function isS3Configured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
  );
}
