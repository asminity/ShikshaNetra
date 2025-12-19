import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
// UPDATE: Import from the new models folder
import { createJob } from "@/lib/models/Job";
import { processVideoAnalysis } from "@/lib/services/videoAnalysisProcessor";


export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - invalid or missing token" },
        { status: 401 }
      );
    }

    // 2. Parse form-data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const subject = formData.get("subject") as string;
    const language = formData.get("language") as string;

    if (!file || !subject || !language) {
      return NextResponse.json(
        { error: "File, subject, and language are required" },
        { status: 400 }
      );
    }

    // HF_SPACE is configured inside the processor

    // 3. Create job FIRST with minimal metadata (don't wait for upload)
    const job = await createJob({
      userId: user.id,
      videoMetadata: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      },
      subject,
      language,
    });

    console.log("Created job:", job.id);

    // 4. Start async processing (don't await)
    // Processor will upload file and update job with storage metadata
    processVideoAnalysis(job.id, file, user.id, subject, language).catch(
      (error) => {
        console.error("Fatal error in background process:", error);
      }
    );

    // 5. Return job immediately for frontend tracking
    return NextResponse.json(
      {
        success: true,
        job,
      },
      { status: 202 } // 202 Accepted - processing started
    );

  } catch (error: any) {
    console.error("Job creation error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create analysis job",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}