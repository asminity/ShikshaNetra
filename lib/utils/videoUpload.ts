import { uploadVideo } from "../services/storageService";

/**
 * Upload video file to Supabase and return metadata
 * Centralized utility for video upload operations
 */
export async function uploadVideoToStorage(
  file: File,
  userId: string
): Promise<{
  success: boolean;
  videoMetadata?: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    videoUrl: string;
    signedUrl: string;
    storagePath: string;
  };
  error?: string;
}> {
  try {
    console.log(`Uploading video to Supabase: ${file.name}`);
    const uploadResult = await uploadVideo(file, userId, file.name);

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error || "Failed to upload video to storage",
      };
    }

    console.log(`Video uploaded successfully with signed URL`);

    // For private buckets, we use the storage path as the video URL identifier
    // Actual playback will require generating signed URLs
    const videoUrl = `supabase://${uploadResult.path}`;

    // Return standardized video metadata
    return {
      success: true,
      videoMetadata: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        videoUrl: videoUrl,
        signedUrl: uploadResult.signedUrl!,
        storagePath: uploadResult.path!,
      },
    };
  } catch (error) {
    console.error("Upload video utility error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown upload error",
    };
  }
}

/**
 * Prepare ML microservice payload with signed video URL
 */
export function prepareMLPayload(
  signedUrl: string,
  subject: string,
  language: string,
  file: File,
  userId: string
) {
  return {
    video_url: signedUrl,
    topic: subject,
    language: language,
    metadata: {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      userId: userId,
    },
  };
}
