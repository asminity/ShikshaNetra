"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/Card";
import { useToast } from "@/components/ToastContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getWithAuth } from "@/lib/utils/api";

interface Analysis {
  id: string;
  sessionId: string;
  topic: string;
  subject: string;
  language: string;
  transcript: string;
  createdAt: string;
  clarityScore: number;
  confidenceScore: number;
  audioFeatures: number[];
  engagementScore: number;
  gestureIndex: number;
  dominantEmotion: string;
  technicalDepth: number;
  interactionIndex: number;
  topicRelevanceScore: number;
  coachSuggestions?: string[];
  coachStrengths?: string[];
  videoMetadata: {
    fileName: string;
    storagePath?: string;
  };
}

export default function ReportPage({ params }: { params: { id: string } }) {
  const { showToast } = useToast();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("shikshanetra_token");
    if (!token) {
      showToast("Please login to view reports");
      router.push("/login");
      return;
    }

    fetchAnalysisReport();
  }, [params.id]);

  const fetchAnalysisReport = async () => {
    try {
      const response = await getWithAuth(`/api/analyze/${params.id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch analysis report");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      showToast("Failed to load analysis report");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadVideo = async () => {
    if (!analysis?.videoMetadata?.storagePath) {
      showToast("Video not available");
      return;
    }

    setLoadingVideo(true);
    try {
      const response = await getWithAuth(
        `/api/video/signed-url?path=${encodeURIComponent(analysis.videoMetadata.storagePath)}`
      );

      if (!response.ok) {
        throw new Error("Failed to generate video URL");
      }

      const data = await response.json();
      setVideoUrl(data.signedUrl);
    } catch (error) {
      console.error("Error loading video:", error);
      showToast("Failed to load video");
    } finally {
      setLoadingVideo(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-rose-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-rose-100";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-600">Loading report...</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-600">Report not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50/20 py-8">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-2 inline-flex items-center text-sm text-slate-600 hover:text-primary-600"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Analysis Report</h1>
            <p className="mt-1 text-sm text-slate-600">
              {formatDate(analysis.createdAt)}
            </p>
          </div>
        </div>

        {/* Session Info */}
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Session Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Topic
              </p>
              <p className="mt-1 text-sm text-slate-900 font-medium">{analysis.topic}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Subject
              </p>
              <p className="mt-1 text-sm text-slate-900">{analysis.subject}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Language
              </p>
              <p className="mt-1 text-sm text-slate-900">{analysis.language}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Session ID
              </p>
              <p className="mt-1 text-xs text-slate-900 font-mono">
                {analysis.sessionId}
              </p>
            </div>
          </div>
        </Card>

        {/* Video Player */}
        {analysis.videoMetadata?.storagePath && (
          <Card className="mb-6 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Session Recording
            </h2>
            {videoUrl ? (
              <video
                controls
                className="w-full rounded-lg"
                src={videoUrl}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-lg">
                <p className="text-slate-600 mb-4">Click to load video</p>
                <button
                  onClick={loadVideo}
                  disabled={loadingVideo}
                  className="btn-primary"
                >
                  {loadingVideo ? "Loading..." : "Load Video"}
                </button>
              </div>
            )}
          </Card>
        )}

        {/* Scores Overview */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Clarity Score
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className={`text-3xl font-bold ${getScoreColor(analysis.clarityScore)}`}>
                {analysis.clarityScore.toFixed(1)}
              </p>
              <span className="text-sm text-slate-500">/ 100</span>
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Confidence Score
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className={`text-3xl font-bold ${getScoreColor(analysis.confidenceScore)}`}>
                {analysis.confidenceScore.toFixed(1)}
              </p>
              <span className="text-sm text-slate-500">/ 100</span>
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Engagement Score
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className={`text-3xl font-bold ${getScoreColor(analysis.engagementScore)}`}>
                {analysis.engagementScore.toFixed(1)}
              </p>
              <span className="text-sm text-slate-500">/ 100</span>
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Technical Depth
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className={`text-3xl font-bold ${getScoreColor(analysis.technicalDepth)}`}>
                {analysis.technicalDepth.toFixed(1)}
              </p>
              <span className="text-sm text-slate-500">/ 100</span>
            </div>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Gesture Index
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {analysis.gestureIndex.toFixed(1)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Interaction Index
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {analysis.interactionIndex.toFixed(1)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Dominant Emotion
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 capitalize">
              {analysis.dominantEmotion}
            </p>
          </Card>
        </div>

        {/* Transcript */}
        {analysis.transcript && (
          <Card className="mb-6 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Transcript
            </h2>
            <div className="prose prose-sm max-w-none">
              <p className="text-slate-700 whitespace-pre-wrap">{analysis.transcript}</p>
            </div>
          </Card>
        )}

        {/* Coach Feedback */}
        {(analysis.coachStrengths || analysis.coachSuggestions) && (
          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            {analysis.coachStrengths && analysis.coachStrengths.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Strengths
                </h2>
                <ul className="space-y-2">
                  {analysis.coachStrengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span className="text-sm text-slate-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {analysis.coachSuggestions && analysis.coachSuggestions.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Areas for Improvement
                </h2>
                <ul className="space-y-2">
                  {analysis.coachSuggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary-600 mt-0.5">→</span>
                      <span className="text-sm text-slate-700">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
