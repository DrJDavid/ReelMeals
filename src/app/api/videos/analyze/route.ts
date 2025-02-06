import { auth } from "@/lib/firebase/firebase-admin";
import { RecipeAnalysisService } from "@/lib/services/recipe-analysis";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);

    if (!decodedToken.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get video data from request body
    const { videoId, videoUrl } = await request.json();

    if (!videoId || !videoUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Process video
    await RecipeAnalysisService.processVideo(videoId, videoUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in video analysis endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
