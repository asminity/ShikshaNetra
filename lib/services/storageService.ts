import { supabaseServer, VIDEO_BUCKET } from '@/lib/config/supabase';

export type UploadResult = {
  success: boolean;
  url?: string;
  signedUrl?: string;
  path?: string;
  error?: string;
};

/**
 * Upload video file to Supabase Storage
 * @param file - The video file to upload
 * @param userId - User ID for organizing files
 * @param fileName - Optional custom file name
 * @returns Upload result with URL or error
 */

export async function uploadVideo(
  file: File,
  userId: string,
  fileName?: string
) {
  try {
    const timestamp = Date.now();
    const sanitizedFileName = fileName || file.name;
    const uniqueFileName = `${userId}/${timestamp}_${sanitizedFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Upload using SERVICE ROLE KEY CLIENT
    const { data, error } = await supabaseServer.storage
      .from(VIDEO_BUCKET)
      .upload(uniqueFileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) return { success: false, error: error.message };

    // Generate signed URL for ML service (24 hours)
    const { data: signedData, error: signedError } = await supabaseServer.storage
      .from(VIDEO_BUCKET)
      .createSignedUrl(uniqueFileName, 86400);

    if (signedError || !signedData) {
      return { success: false, error: signedError?.message || 'Failed to generate signed URL' };
    }

    return {
      success: true,
      path: uniqueFileName,
      signedUrl: signedData.signedUrl,
    };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}


/**
 * Delete video from Supabase Storage
 * @param path - The storage path of the video
 * @returns Success boolean
 */
export async function deleteVideo(path: string): Promise<boolean> {
  try {
    const { error } = await supabaseServer.storage
      .from(VIDEO_BUCKET)
      .remove([path]);

    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }

    console.log(`Video deleted successfully: ${path}`);
    return true;
  } catch (error) {
    console.error('Delete video error:', error);
    return false;
  }
}

/**
 * Get signed URL for private video access (with expiration)
 * @param path - The storage path of the video
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL or null
 */
export async function getSignedVideoUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabaseServer.storage
      .from(VIDEO_BUCKET)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Supabase signed URL error:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Get signed URL error:', error);
    return null;
  }
}

/**
 * List all videos for a user
 * @param userId - User ID to filter videos
 * @returns List of video paths
 */
export async function listUserVideos(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseServer.storage
      .from(VIDEO_BUCKET)
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('Supabase list error:', error);
      return [];
    }

    return data?.map((file) => `${userId}/${file.name}`) || [];
  } catch (error) {
    console.error('List videos error:', error);
    return [];
  }
}

/**
 * Initialize storage bucket (create if doesn't exist)
 * This should be called during setup
 */
export async function initializeStorageBucket(): Promise<boolean> {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabaseServer.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }

    const bucketExists = buckets?.some((bucket) => bucket.name === VIDEO_BUCKET);

    if (!bucketExists) {
      // Create bucket with private access (requires signed URLs)
      const { error: createError } = await supabaseServer.storage.createBucket(VIDEO_BUCKET, {
        public: false,
        fileSizeLimit: 524288000, // 500MB limit
        allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'],
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return false;
      }

      console.log(`Storage bucket "${VIDEO_BUCKET}" created successfully`);
    } else {
      console.log(`Storage bucket "${VIDEO_BUCKET}" already exists`);
    }

    return true;
  } catch (error) {
    console.error('Initialize storage error:', error);
    return false;
  }
}
