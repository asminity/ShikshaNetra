import { MLResponse, CreateAnalysisInput } from "@/lib/types/analysis";

export function transformMLResponse(
  mlResponse: MLResponse,
  userId: string,
  videoMetadata: any,
  subject: string,
  language: string,
  videoUrl?: string
): Omit<CreateAnalysisInput, "status"> {
  // Handle both success and error cases
  if (!mlResponse.success || !mlResponse.data) {
    // Return minimal data structure for failed analysis
    return {
      userId,
      videoMetadata,
      subject,
      language,
      videoUrl,
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
      coachFeedbackError: mlResponse.error || "Analysis failed",
      mlResponse,
    };
  }

  const data = mlResponse.data;
  const audioScores = data.scores.audio;
  const videoScores = data.scores.video;
  const textScores = data.scores.text;
  
  return {
    userId,
    videoMetadata,
    subject,
    language,
    videoUrl,
    
    // Session info
    sessionId: data.session_id,
    topic: data.topic,
    transcript: data.transcript,
    
    // Audio scores - store as-is from ML service
    clarityScore: audioScores.clarity_score,
    confidenceScore: audioScores.confidence_score,
    audioFeatures: audioScores.features || [],
    
    // Video scores - store as-is from ML service
    engagementScore: videoScores.engagement_score,
    gestureIndex: videoScores.gesture_index,
    dominantEmotion: videoScores.dominant_emotion || "neutral",
    
    // Text scores - store as-is from ML service
    technicalDepth: textScores.technical_depth,
    interactionIndex: textScores.interaction_index,
    topicMatches: textScores.topic_relevance?.matches || {},
    topicRelevanceScore: textScores.topic_relevance?.relevance_score || 0,
    
    // Coach feedback (optional, only if ML provides it)
    coachFeedbackError: data.coach_feedback?.error,
    coachSuggestions: data.coach_feedback?.improvements,
    coachStrengths: data.coach_feedback?.strengths,
    
    // Keep original response for reference
    mlResponse,
  };
}
