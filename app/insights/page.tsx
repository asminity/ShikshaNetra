"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { useToast } from "@/components/ToastContext";
import { getWithAuth } from "@/lib/utils/api";

type Analysis = {
  _id: string;
  userId: string;
  topic: string;
  clarityScore: number;
  confidenceScore: number;
  engagementScore: number;
  technicalDepth: number;
  interactionIndex: number;
  dominantEmotion: string;
  transcript: string;
  coachSuggestions?: string[];
  coachStrengths?: string[];
  videoMetadata: {
    fileName: string;
    duration?: number;
    size?: number;
    mimeType?: string;
    storagePath?: string;
  };
  videoUrl?: string;
  createdAt: string;
  status: string;
};

export default function InsightsPage() {
  const { showToast } = useToast();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [videoPlaybackUrl, setVideoPlaybackUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("shikshanetra_token");
    setIsLoggedIn(!!token);
    
    if (token) {
      fetchAnalyses();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAnalyses = async () => {
    try {
      const response = await getWithAuth("/api/analyze/history?limit=10");

      if (!response.ok) {
        throw new Error("Failed to fetch analysis history");
      }

      const data = await response.json();
      setAnalyses(data.analyses || []);
      if (data.analyses && data.analyses.length > 0) {
        setSelectedAnalysis(data.analyses[0]);
      }
    } catch (error) {
      console.error("Error fetching analyses:", error);
      showToast("Failed to load analysis history");
    } finally {
      setLoading(false);
    }
  };

  const fetchSignedUrl = async (storagePath: string) => {
    setLoadingVideo(true);
    setVideoPlaybackUrl(null);
    try {
      const response = await getWithAuth(`/api/video/signed-url?path=${encodeURIComponent(storagePath)}`);

      if (!response.ok) {
        throw new Error("Failed to get signed URL");
      }

      const data = await response.json();
      setVideoPlaybackUrl(data.signedUrl);
    } catch (error) {
      console.error("Error fetching signed URL:", error);
      showToast("Failed to load video playback URL");
    } finally {
      setLoadingVideo(false);
    }
  };

  const getOverallScore = (analysis: Analysis) => {
    const avg = (
      analysis.clarityScore +
      analysis.confidenceScore +
      analysis.engagementScore +
      analysis.technicalDepth +
      analysis.interactionIndex
    ) / 5;
    return Math.round(avg);
  };

  const calculateKPIs = () => {
    if (analyses.length === 0) {
      return {
        avgScore: 0,
        totalSessions: 0,
        avgEngagement: 0,
        avgClarity: 0,
      };
    }

    const avgScore = analyses.reduce((sum, a) => sum + getOverallScore(a), 0) / analyses.length;
    const avgEngagement = analyses.reduce((sum, a) => sum + a.engagementScore, 0) / analyses.length;
    const avgClarity = analyses.reduce((sum, a) => sum + a.clarityScore, 0) / analyses.length;

    return {
      avgScore: Math.round(avgScore),
      totalSessions: analyses.length,
      avgEngagement: avgEngagement.toFixed(1),
      avgClarity: avgClarity.toFixed(1),
    };
  };

  const kpis = (() => {
    const stats = calculateKPIs();
    return [
      {
        label: "Average Overall Score",
        value: `${stats.avgScore}/100`,
        description: `Based on ${stats.totalSessions} analyzed sessions.`,
      },
      {
        label: "Sessions Evaluated",
        value: stats.totalSessions.toString(),
        description: "Total analyses completed.",
      },
      {
        label: "Average Engagement",
        value: `${stats.avgEngagement}`,
        description: "Video analysis metric.",
      },
      {
        label: "Average Clarity Score",
        value: `${stats.avgClarity}`,
        description: "Audio analysis metric.",
      },
    ];
  })();

  const radarSkills = selectedAnalysis ? [
    { label: "Clarity", value: selectedAnalysis.clarityScore },
    { label: "Confidence", value: selectedAnalysis.confidenceScore },
    { label: "Engagement", value: selectedAnalysis.engagementScore },
    { label: "Technical Depth", value: selectedAnalysis.technicalDepth },
    { label: "Interaction", value: selectedAnalysis.interactionIndex },
  ] : [];

  const trendSessions = analyses.slice(0, 7).reverse().map((a, idx) => ({
    label: `Session ${idx + 1}`,
    value: getOverallScore(a),
  }));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  };

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pt-10">
        <PageHeader
          title="Insights & Analytics"
          subtitle="Visual overview of your performance and evaluation metrics."
          badge={<span className="badge-pill">History</span>}
        />
        <Card className="p-8 text-center">
          <p className="text-slate-600">Please login to view your analysis insights.</p>
          <button
            onClick={() => window.location.href = "/login"}
            className="btn-primary mt-4 px-6 py-2"
          >
            Go to Login
          </button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pt-10">
        <PageHeader
          title="Insights & Analytics"
          subtitle="Loading your analysis history..."
          badge={<span className="badge-pill">History</span>}
        />
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pt-10">
        <PageHeader
          title="Insights & Analytics"
          subtitle="Visual overview of your performance and evaluation metrics."
          badge={<span className="badge-pill">History</span>}
        />
        <Card className="p-8 text-center">
          <p className="text-slate-600">No analyses found. Start by analyzing a video in the Demo section.</p>
          <button
            onClick={() => window.location.href = "/demo"}
            className="btn-primary mt-4 px-6 py-2"
          >
            Go to Demo
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pt-10">
      <PageHeader
        title="Insights & Analytics"
        subtitle="Visual overview of your performance and evaluation metrics."
        badge={<span className="badge-pill">Live Data</span>}
      />

      {/* KPI Row */}
      <section className="grid gap-4 md:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <p className="text-xs font-medium text-slate-600">{kpi.label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{kpi.value}</p>
            <p className="mt-1 text-[11px] text-slate-500">{kpi.description}</p>
          </Card>
        ))}
      </section>

      {/* Charts */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Radar-like Skills */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            {selectedAnalysis ? `Skill Distribution – Latest Session` : "Skill Distribution"}
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            {selectedAnalysis ? `Analysis from ${formatDate(selectedAnalysis.createdAt)}` : "No data available"}
          </p>
          {radarSkills.length > 0 ? (
            <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative h-40 w-40 rounded-full bg-gradient-to-br from-primary-50 via-slate-50 to-accent-50">
                <div className="absolute inset-6 rounded-full border border-dashed border-primary-200" />
                <div className="absolute inset-3 rounded-full border border-dashed border-accent-200" />
                <div className="absolute inset-1 rounded-full border border-slate-100" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary-700">
                    Skill Profile
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-2 text-xs">
                {radarSkills.map((skill) => (
                  <div key={skill.label}>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">{skill.label}</span>
                      <span className="font-semibold text-primary-700">
                        {skill.value.toFixed(1)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-400 to-accent-400"
                        style={{ width: `${Math.min((skill.value / 100) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 flex items-center justify-center py-8">
              <p className="text-sm text-slate-400">No analysis data available</p>
            </div>
          )}
        </Card>

        {/* Trend over time */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Scores Across Recent Sessions
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Your performance trend across the last {Math.min(analyses.length, 7)} sessions
          </p>
          {trendSessions.length > 0 ? (
            <div className="mt-5 flex h-44 items-end gap-2 rounded-xl bg-slate-50 px-4 py-3">
              {trendSessions.map((s) => (
                <div
                  key={s.label}
                  className="flex flex-1 flex-col items-center justify-end gap-1"
                >
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-primary-500 to-accent-400 transition-all hover:from-primary-600 hover:to-accent-500"
                    style={{ height: `${(s.value / 100) * 90}%` }}
                    title={`${s.value}/100`}
                  />
                  <span className="text-[10px] text-slate-500">{s.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 flex h-44 items-center justify-center">
              <p className="text-sm text-slate-400">No trend data available</p>
            </div>
          )}
        </Card>
      </section>

      {/* Recent sessions + Details */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[1.6fr,0.9fr]">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Recent Sessions
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Your latest video analyses with performance scores
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Topic
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Score
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Emotion
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analyses.slice(0, 5).map((analysis, idx) => (
                  <tr
                    key={analysis._id}
                    className={`cursor-pointer transition-colors ${
                      idx % 2 === 0 ? "bg-white hover:bg-primary-50/30" : "bg-slate-50/60 hover:bg-primary-50/30"
                    } ${selectedAnalysis?._id === analysis._id ? "bg-primary-50" : ""}`}
                    onClick={() => {
                      setSelectedAnalysis(analysis);
                      setVideoPlaybackUrl(null);
                    }}
                  >
                    <td className="whitespace-nowrap px-4 py-2 text-slate-700">
                      {formatDate(analysis.createdAt)}
                    </td>
                    <td className="px-4 py-2 text-slate-800">
                      {analysis.topic}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-800">
                      <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                        {getOverallScore(analysis)}/100
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                      {analysis.dominantEmotion}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] bg-emerald-50 text-emerald-700">
                        {analysis.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Video Player - Full Width */}
        {selectedAnalysis && selectedAnalysis.videoMetadata.storagePath && (
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              Session Recording
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              {selectedAnalysis.videoMetadata.fileName}
            </p>
            {!videoPlaybackUrl && !loadingVideo && (
              <div className="mt-4 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-8">
                <button
                  onClick={() => fetchSignedUrl(selectedAnalysis.videoMetadata.storagePath!)}
                  className="btn-primary px-6 py-2 text-sm"
                >
                  Load Video
                </button>
              </div>
            )}
            {loadingVideo && (
              <div className="mt-4 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
              </div>
            )}
            {videoPlaybackUrl && (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-black">
                <video
                  controls
                  className="w-full"
                  src={videoPlaybackUrl}
                  preload="metadata"
                  key={videoPlaybackUrl}
                >
                  <source src={videoPlaybackUrl} type={selectedAnalysis.videoMetadata.mimeType || "video/mp4"} />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
          </Card>
        )}

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            {selectedAnalysis ? "Selected Analysis" : "Session Details"}
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            {selectedAnalysis ? "Click on any session to view details" : "Select a session to view details"}
          </p>
          {selectedAnalysis ? (
            <div className="mt-3 space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-medium text-slate-500">Topic</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedAnalysis.topic}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-medium text-slate-500">File Name</p>
                <p className="mt-1 text-xs text-slate-700">{selectedAnalysis.videoMetadata.fileName}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-medium text-slate-500">Overall Score</p>
                <p className="mt-1 text-2xl font-bold text-primary-700">{getOverallScore(selectedAnalysis)}/100</p>
              </div>
              {selectedAnalysis.coachStrengths && selectedAnalysis.coachStrengths.length > 0 && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-[11px] font-semibold text-emerald-700">Key Strengths</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-emerald-800">
                    {selectedAnalysis.coachStrengths.slice(0, 2).map((strength, idx) => (
                      <li key={idx}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedAnalysis.coachSuggestions && selectedAnalysis.coachSuggestions.length > 0 && (
                <div className="rounded-lg border border-accent-200 bg-accent-50 p-3">
                  <p className="text-[11px] font-semibold text-accent-700">Top Suggestions</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-accent-800">
                    {selectedAnalysis.coachSuggestions.slice(0, 2).map((suggestion, idx) => (
                      <li key={idx}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-5 flex items-center justify-center py-8">
              <p className="text-sm text-slate-400">Select a session from the table</p>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
