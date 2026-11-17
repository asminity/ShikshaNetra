import { Client } from "@gradio/client";
import type { CoachFeedback, MLResponse } from "@/lib/types/analysis";

export const HF_SPACE = "asminity12/Shikshanetra-model";

// Output positions of the Space's /analyze_session endpoint:
// [progress HTML, overview HTML, timeline HTML, coach HTML, full report JSON, chat history]
const PROGRESS_INDEX = 0;
const REPORT_INDEX = 4;

type MLData = NonNullable<MLResponse["data"]>;

/** Pull the "Analysis failed: ..." reason out of the Space's progress HTML. */
function failureReason(progressHtml: unknown): string {
  if (typeof progressHtml !== "string") return "Analysis service returned no report";
  const text = progressHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const match = text.match(/Analysis failed:\s*(.+)$/i);
  return match ? `Analysis failed: ${match[1].trim()}` : "Analysis service returned no report";
}

/**
 * The Space reports flat scores (`audio.clarity_score`, `video.emotion_confidence`, ...).
 * The app stores them nested under `overall` with `confidence_score` for video, so convert here.
 */
export function normalizeSpaceReport(report: any): MLData {
  const audio = report?.scores?.audio ?? {};
  const video = report?.scores?.video ?? {};
  const text = report?.scores?.text ?? {};

  const audioOverall = audio.overall ?? {
    clarity_score: audio.clarity_score,
    confidence_score: audio.confidence_score,
  };
  const videoOverall = video.overall ?? {
    engagement_score: video.engagement_score,
    gesture_index: video.gesture_index,
    dominant_emotion: video.dominant_emotion,
    confidence_score: video.confidence_score ?? video.emotion_confidence,
  };

  return {
    session_id: report?.session_id,
    topic: report?.topic,
    transcript: report?.transcript ?? "",
    metadata: report?.metadata,
    scores: {
      audio: { overall: audioOverall, per_minute: audio.per_minute ?? [] },
      video: {
        overall: videoOverall,
        per_minute: (video.per_minute ?? []).map((m: any) => ({
          ...m,
          confidence_score: m.confidence_score ?? m.emotion_confidence,
        })),
      },
      text,
    },
    coach_feedback: report?.coach_feedback,
  };
}

/** The Space's own coach feedback, or undefined if it is missing or errored (e.g. no OpenAI key). */
export function spaceCoachFeedback(data: MLData): CoachFeedback | undefined {
  const fb: any = data.coach_feedback;
  if (!fb || fb.error || !fb.performance_summary || !fb.strengths || !fb.weaknesses) return undefined;
  return fb as CoachFeedback;
}

/** Run the full analysis on the Space and return the report in the app's format. */
export async function analyzeOnSpace(video: Blob, topic: string): Promise<MLData> {
  const client = await Client.connect(HF_SPACE);
  const result: any = await client.predict("/analyze_session", { video, topic });
  const data = result?.data;
  const report = Array.isArray(data) ? data[REPORT_INDEX] : undefined;

  // On failure the Space leaves the report output untouched and puts the reason in the progress HTML.
  if (!report || typeof report !== "object" || !report.scores) {
    throw new Error(failureReason(Array.isArray(data) ? data[PROGRESS_INDEX] : undefined));
  }
  return normalizeSpaceReport(report);
}
