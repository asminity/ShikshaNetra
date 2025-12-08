import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/middleware/auth';
import { getSignedVideoUrl } from '@/lib/services/storageService';

/**
 * Generate signed URL for video playback
 * GET /api/video/signed-url?path=userId/timestamp_video.mp4
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const user = authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or missing token' },
        { status: 401 }
      );
    }

    // Get storage path from query params
    const { searchParams } = new URL(req.url);
    const storagePath = searchParams.get('path');

    if (!storagePath) {
      return NextResponse.json(
        { error: 'Storage path is required' },
        { status: 400 }
      );
    }

    // Verify user owns this video (path should start with userId)
    if (!storagePath.startsWith(user.id + '/')) {
      return NextResponse.json(
        { error: 'Access denied - You can only access your own videos' },
        { status: 403 }
      );
    }

    // Generate signed URL (valid for 1 hour for playback)
    const signedUrl = await getSignedVideoUrl(storagePath, 3600);

    if (!signedUrl) {
      return NextResponse.json(
        { error: 'Failed to generate signed URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Signed URL error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
