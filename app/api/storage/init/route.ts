import { NextRequest, NextResponse } from 'next/server';
import { initializeStorageBucket } from '@/lib/services/storageService';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

/**
 * Initialize Supabase Storage Bucket
 * POST /api/storage/init
 * Headers: { "x-admin-secret": "your-admin-secret" }
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin secret
    const adminSecret = req.headers.get('x-admin-secret');
    
    if (!adminSecret || adminSecret !== ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid admin secret' },
        { status: 401 }
      );
    }

    console.log('Initializing Supabase storage bucket...');

    // Initialize bucket
    const success = await initializeStorageBucket();

    if (!success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to initialize storage bucket',
          message: 'Check logs for details'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Storage bucket initialized successfully',
      bucket: 'analysis-videos',
    });
  } catch (error) {
    console.error('Storage initialization error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
