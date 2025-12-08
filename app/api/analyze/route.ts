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
        { error: "Unauthorized - Invalid or missing token" },
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
        { error: "File is required" },
        { status: 400 }
      );
    }

    if (!subject || !language) {
      return NextResponse.json(
        { error: "Subject and language are required" },
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

    console.log(`Sending signed video URL to ML service, topic: ${subject}`);

    // Send request to ML microservice with video URL
    const mlResponse = await fetch(`${ML_MICROSERVICE_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mlPayload),
    });

    console.log(`ML service response status: ${mlResponse.status}`);

    // Get response as JSON
    const mlResult: MLResponse = await mlResponse.json();

    // Handle ML service errors
    if (!mlResponse.ok || !mlResult.success) {
      const errorMessage = mlResult.error || `ML service returned status ${mlResponse.status}`;
      console.error("ML service error:", errorMessage);
      
      // Save failed analysis to database
      try {
        await createAnalysis({
          userId: user.id,
          videoMetadata,
          subject,
          language,
          sessionId: "failed",
          topic: subject,
          transcript: "",
          clarityScore: 0,
          confidenceScore: 0,
          audioFeatures: [],
          engagementScore: 0,
          gestureIndex: 0,
          dominantEmotion: "unknown",
          technicalDepth: 0,
          interactionIndex: 0,
          topicMatches: {},
          topicRelevanceScore: 0,
          coachFeedbackError: errorMessage,
          mlResponse: mlResult,
          status: "failed",
        });
      } catch (dbError) {
        console.error("Failed to save error to database:", dbError);
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: mlResult.error,
        },
        { status: mlResponse.status }
      );
    }

    console.log("ML analysis successful, transforming response...");

    // Transform and flatten ML response
    const analysisData = transformMLResponse(
      mlResult,
      user.id,
      videoMetadata,
      subject,
      language,
      mlResult.data?.session_id // Use session_id as video identifier
    );

    // Save analysis to database with video URL
    const savedAnalysis = await createAnalysis({
      ...analysisData,
      videoUrl: videoMetadata.videoUrl,
      status: "completed",
    });

    console.log(`Analysis saved with ID: ${savedAnalysis.id}`);

    // Return the analysis result
    return NextResponse.json(
      {
        success: true,
        message: "Analysis completed successfully",
        analysisId: savedAnalysis.id,
        data: mlResult.data,
        metadata: {
          userId: user.id,
          fileName: file.name,
          uploadedAt: savedAnalysis.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Analyze error:", error);

    // Check if error is due to ML service not being available
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        { 
          success: false,
          error: "ML microservice is not available. Make sure it's running on port 8000.",
          details: "Connection failed" 
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

