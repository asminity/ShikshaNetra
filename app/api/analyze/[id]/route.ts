import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/lib/middleware/auth";
import { getAnalysisById } from "@/lib/models/Analysis";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const user = authMiddleware(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid or missing token" },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get analysis by ID
    const analysis = await getAnalysisById(id);

    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }

    // Check if user owns this analysis
    if (analysis.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - You don't have access to this analysis" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        message: "Analysis retrieved successfully",
        analysis,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
