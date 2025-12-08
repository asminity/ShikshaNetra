import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import {
  Analysis,
  AnalysisResponse,
  CreateAnalysisInput,
  UpdateAnalysisInput,
  AnalysisStats,
} from "@/lib/types/analysis";

const COLLECTION_NAME = "analyses";

export async function createAnalysis(
  analysisData: CreateAnalysisInput
): Promise<AnalysisResponse> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const analysis = {
    ...analysisData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(analysis);

  return {
    id: result.insertedId.toString(),
    userId: analysis.userId,
    videoMetadata: analysis.videoMetadata,
    subject: analysis.subject,
    language: analysis.language,
    videoUrl: analysis.videoUrl,
    sessionId: analysis.sessionId,
    topic: analysis.topic,
    transcript: analysis.transcript,
    clarityScore: analysis.clarityScore,
    confidenceScore: analysis.confidenceScore,
    audioFeatures: analysis.audioFeatures,
    engagementScore: analysis.engagementScore,
    gestureIndex: analysis.gestureIndex,
    dominantEmotion: analysis.dominantEmotion,
    technicalDepth: analysis.technicalDepth,
    interactionIndex: analysis.interactionIndex,
    topicMatches: analysis.topicMatches,
    topicRelevanceScore: analysis.topicRelevanceScore,
    coachFeedbackError: analysis.coachFeedbackError,
    coachSuggestions: analysis.coachSuggestions,
    coachStrengths: analysis.coachStrengths,
    mlResponse: analysis.mlResponse,
    status: analysis.status,
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  };
}

export async function getAnalysisById(id: string): Promise<AnalysisResponse | null> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return null;
  }

  const analysis = await collection.findOne({ _id: objectId });

  if (!analysis) return null;

  return {
    id: analysis._id.toString(),
    userId: analysis.userId,
    videoMetadata: analysis.videoMetadata,
    subject: analysis.subject,
    language: analysis.language,
    videoUrl: analysis.videoUrl,
    sessionId: analysis.sessionId,
    topic: analysis.topic,
    transcript: analysis.transcript,
    clarityScore: analysis.clarityScore,
    confidenceScore: analysis.confidenceScore,
    audioFeatures: analysis.audioFeatures,
    engagementScore: analysis.engagementScore,
    gestureIndex: analysis.gestureIndex,
    dominantEmotion: analysis.dominantEmotion,
    technicalDepth: analysis.technicalDepth,
    interactionIndex: analysis.interactionIndex,
    topicMatches: analysis.topicMatches,
    topicRelevanceScore: analysis.topicRelevanceScore,
    coachFeedbackError: analysis.coachFeedbackError,
    coachSuggestions: analysis.coachSuggestions,
    coachStrengths: analysis.coachStrengths,
    mlResponse: analysis.mlResponse,
    status: analysis.status,
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  } as AnalysisResponse;
}

export async function getAnalysesByUserId(
  userId: string,
  limit = 10,
  skip = 0
): Promise<AnalysisResponse[]> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const analyses = await collection
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .toArray();

  return analyses.map((analysis) => ({
    id: analysis._id.toString(),
    userId: analysis.userId,
    videoMetadata: analysis.videoMetadata,
    subject: analysis.subject,
    language: analysis.language,
    videoUrl: analysis.videoUrl,
    sessionId: analysis.sessionId,
    topic: analysis.topic,
    transcript: analysis.transcript,
    clarityScore: analysis.clarityScore,
    confidenceScore: analysis.confidenceScore,
    audioFeatures: analysis.audioFeatures,
    engagementScore: analysis.engagementScore,
    gestureIndex: analysis.gestureIndex,
    dominantEmotion: analysis.dominantEmotion,
    technicalDepth: analysis.technicalDepth,
    interactionIndex: analysis.interactionIndex,
    topicMatches: analysis.topicMatches,
    topicRelevanceScore: analysis.topicRelevanceScore,
    coachFeedbackError: analysis.coachFeedbackError,
    coachSuggestions: analysis.coachSuggestions,
    coachStrengths: analysis.coachStrengths,
    mlResponse: analysis.mlResponse,
    status: analysis.status,
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  })) as AnalysisResponse[];
}

export async function updateAnalysis(
  id: string,
  updates: UpdateAnalysisInput
): Promise<AnalysisResponse | null> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return null;
  }

  const result = await collection.findOneAndUpdate(
    { _id: objectId },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  if (!result || !result.value) return null;

  const updated = result.value;
  return {
    id: updated._id.toString(),
    userId: updated.userId,
    videoMetadata: updated.videoMetadata,
    subject: updated.subject,
    language: updated.language,
    videoUrl: updated.videoUrl,
    sessionId: updated.sessionId,
    topic: updated.topic,
    transcript: updated.transcript,
    clarityScore: updated.clarityScore,
    confidenceScore: updated.confidenceScore,
    audioFeatures: updated.audioFeatures,
    engagementScore: updated.engagementScore,
    gestureIndex: updated.gestureIndex,
    dominantEmotion: updated.dominantEmotion,
    technicalDepth: updated.technicalDepth,
    interactionIndex: updated.interactionIndex,
    topicMatches: updated.topicMatches,
    topicRelevanceScore: updated.topicRelevanceScore,
    coachFeedbackError: updated.coachFeedbackError,
    coachSuggestions: updated.coachSuggestions,
    coachStrengths: updated.coachStrengths,
    mlResponse: updated.mlResponse,
    status: updated.status,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  } as AnalysisResponse;
}

export async function deleteAnalysis(id: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return false;
  }

  const result = await collection.deleteOne({ _id: objectId });

  return result.deletedCount > 0;
}

export async function getAnalysisStats(userId: string): Promise<AnalysisStats> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const stats = await collection
    .aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  return stats.reduce((acc, stat) => {
    acc[stat._id as string] = stat.count;
    return acc;
  }, {} as AnalysisStats);
}

export async function searchAnalyses(
  filters: import("@/lib/types/analysis").AnalysisSearchFilters,
  limit = 10,
  skip = 0
): Promise<AnalysisResponse[]> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);

  const query: any = {};

  // Build query based on filters
  if (filters.userId) query.userId = filters.userId;
  if (filters.subject) query.subject = filters.subject;
  if (filters.topic) query.topic = { $regex: filters.topic, $options: "i" };
  if (filters.dominantEmotion) query.dominantEmotion = filters.dominantEmotion;
  if (filters.status) query.status = filters.status;

  // Score filters
  if (filters.minClarityScore !== undefined) {
    query.clarityScore = { $gte: filters.minClarityScore };
  }
  if (filters.minConfidenceScore !== undefined) {
    query.confidenceScore = { $gte: filters.minConfidenceScore };
  }
  if (filters.minEngagementScore !== undefined) {
    query.engagementScore = { $gte: filters.minEngagementScore };
  }
  if (filters.minTechnicalDepth !== undefined) {
    query.technicalDepth = { $gte: filters.minTechnicalDepth };
  }

  // Date filters
  if (filters.fromDate || filters.toDate) {
    query.createdAt = {};
    if (filters.fromDate) query.createdAt.$gte = filters.fromDate;
    if (filters.toDate) query.createdAt.$lte = filters.toDate;
  }

  const analyses = await collection
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .toArray();

  return analyses.map((analysis) => ({
    id: analysis._id.toString(),
    userId: analysis.userId,
    videoMetadata: analysis.videoMetadata,
    subject: analysis.subject,
    language: analysis.language,
    videoUrl: analysis.videoUrl,
    sessionId: analysis.sessionId,
    topic: analysis.topic,
    transcript: analysis.transcript,
    clarityScore: analysis.clarityScore,
    confidenceScore: analysis.confidenceScore,
    audioFeatures: analysis.audioFeatures,
    engagementScore: analysis.engagementScore,
    gestureIndex: analysis.gestureIndex,
    dominantEmotion: analysis.dominantEmotion,
    technicalDepth: analysis.technicalDepth,
    interactionIndex: analysis.interactionIndex,
    topicMatches: analysis.topicMatches,
    topicRelevanceScore: analysis.topicRelevanceScore,
    coachFeedbackError: analysis.coachFeedbackError,
    coachSuggestions: analysis.coachSuggestions,
    coachStrengths: analysis.coachStrengths,
    mlResponse: analysis.mlResponse,
    status: analysis.status,
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  })) as AnalysisResponse[];
}
