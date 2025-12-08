import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { createAnalysis } from "@/lib/models/Analysis";
import { transformMLResponse } from "@/lib/services/analysisService";
import { uploadVideoToStorage, prepareMLPayload } from "@/lib/utils/videoUpload";
import { MLResponse } from "@/lib/types/analysis";

const ML_MICROSERVICE_URL = process.env.ML_MICROSERVICE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const user = authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Invalid or missing token" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const subject = formData.get("subject") as string;
    const language = formData.get("language") as string;

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 }
      );
    }

    if (!subject || !language) {
      return NextResponse.json(
        { success: false, error: "Subject and language are required" },
        { status: 400 }
      );
    }

    // Upload video to Supabase Storage using utility function
    const uploadResult = await uploadVideoToStorage(file, user.id);

    if (!uploadResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: uploadResult.error || "Failed to upload video to storage"
        },
        { status: 500 }
      );
    }

    const videoMetadata = uploadResult.videoMetadata!;

    // Prepare ML payload using utility function with signed URL
    const mlPayload = prepareMLPayload(
      videoMetadata.signedUrl,
      subject,
      language,
      file,
      user.id
    );

    console.log(`Sending signed video URL to ML service (scores-only)`);

    // Send request to ML microservice scores-only endpoint
    const mlResponse = await fetch(`${ML_MICROSERVICE_URL}/analyze/scores-only`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mlPayload),
    });

    // Get response as JSON
    const mlResult: MLResponse = await mlResponse.json();

    // Handle ML service errors
    if (!mlResponse.ok || !mlResult.success) {
      const errorMessage = mlResult.error || `ML service returned status ${mlResponse.status}`;
      
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: mlResponse.status }
      );
    }

    // Transform and flatten ML response
    const analysisData = transformMLResponse(
      mlResult,
      user.id,
      videoMetadata,
      subject,
      language,
      mlResult.data?.session_id
    );

    // Save analysis to database with video URL
    const savedAnalysis = await createAnalysis({
      ...analysisData,
      videoUrl: videoMetadata.videoUrl,
      status: "completed",
    });

    // Return the analysis result
    return NextResponse.json(
      {
        success: true,
        message: "Scores analysis completed successfully",
        analysisId: savedAnalysis.id,
        data: mlResult.data,
        note: "This is a scores-only analysis. AI coaching feedback was not generated.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Scores-only analyze error:", error);

    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        { 
          success: false,
          error: "ML microservice is not available on port 8000" 
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error"
      },
      { status: 500 }
    );
  }
}
