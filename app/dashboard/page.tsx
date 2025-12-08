"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/Card";
import { useToast } from "@/components/ToastContext";
import { useRouter } from "next/navigation";
import { getWithAuth } from "@/lib/utils/api";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Analysis {
  id: string;
  sessionId: string;
  topic: string;
  subject: string;
  language: string;
  createdAt: string;
  clarityScore: number;
  confidenceScore: number;
  engagementScore: number;
  technicalDepth: number;
}

export default function DashboardPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [limit] = useState(20); // Increased from 10 to 20

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("shikshanetra_user");
    if (!userData) {
      showToast("Please login to access dashboard");
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchAnalysisHistory();
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/login");
    }
  }, []);

  const fetchAnalysisHistory = async () => {
    try {
      const response = await getWithAuth(`/api/analyze/history?limit=${limit}`);

      if (!response.ok) {
        throw new Error("Failed to fetch analysis history");
      }

      const data = await response.json();
      const fetchedAnalyses = data.analyses || [];
      setAnalyses(fetchedAnalyses);
      
      // If we got fewer results than the limit, there are no more
      setHasMore(fetchedAnalyses.length === limit);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      showToast("Failed to load analysis history");
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear refresh token cookie
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Clear local storage
      localStorage.removeItem("shikshanetra_token");
      localStorage.removeItem("shikshanetra_user");
      localStorage.removeItem("shikshanetra_logged_in");
      
      showToast("Logged out successfully");
      
      // Redirect to home
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local storage even if API fails
      localStorage.removeItem("shikshanetra_token");
      localStorage.removeItem("shikshanetra_user");
      localStorage.removeItem("shikshanetra_logged_in");
      router.push("/");
    }
  };

  const calculateAverageScore = (field: keyof Analysis) => {
    if (analyses.length === 0) return 0;
    const sum = analyses.reduce((acc, analysis) => acc + (Number(analysis[field]) || 0), 0);
    return (sum / analyses.length).toFixed(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "mentor":
        return "bg-primary-100 text-primary-700";
      case "coordinator":
        return "bg-blue-100 text-blue-700";
      case "institution_admin":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50/20 py-8">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Welcome back, {user.name}
          </p>
        </div>

        {/* User Information Card */}
        <Card className="mb-6 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Profile Information
              </h2>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Name
                  </p>
                  <p className="mt-1 text-sm text-slate-900">{user.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Email
                  </p>
                  <p className="mt-1 text-sm text-slate-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Role
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {formatRole(user.role)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
            >
              Logout
            </button>
          </div>
        </Card>

        {/* Statistics Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Total Sessions
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {statsLoading ? "..." : analyses.length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Avg Clarity
            </p>
            <p className="mt-2 text-2xl font-bold text-primary-600">
              {statsLoading ? "..." : calculateAverageScore("clarityScore")}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Avg Confidence
            </p>
            <p className="mt-2 text-2xl font-bold text-primary-600">
              {statsLoading ? "..." : calculateAverageScore("confidenceScore")}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Avg Engagement
            </p>
            <p className="mt-2 text-2xl font-bold text-primary-600">
              {statsLoading ? "..." : calculateAverageScore("engagementScore")}
            </p>
          </Card>
        </div>

        {/* Session History */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Recent Sessions
          </h2>
          
          {loading ? (
            <div className="text-center py-8 text-slate-600">
              Loading session history...
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600">No sessions found</p>
              <p className="mt-2 text-sm text-slate-500">
                Upload a video to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Topic
                    </th>
                    <th className="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Subject
                    </th>
                    <th className="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Language
                    </th>
                    <th className="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide text-right">
                      Clarity
                    </th>
                    <th className="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide text-right">
                      Confidence
                    </th>
                    <th className="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide text-right">
                      Engagement
                    </th>
                    <th className="pb-3 text-xs font-medium text-slate-500 uppercase tracking-wide text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analyses.map((analysis) => (
                    <tr
                      key={analysis.id}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="py-3 text-sm text-slate-600">
                        {formatDate(analysis.createdAt)}
                      </td>
                      <td className="py-3 text-sm text-slate-900 font-medium">
                        {analysis.topic}
                      </td>
                      <td className="py-3 text-sm text-slate-600">
                        {analysis.subject}
                      </td>
                      <td className="py-3 text-sm text-slate-600">
                        {analysis.language}
                      </td>
                      <td className="py-3 text-sm text-slate-900 text-right font-medium">
                        {analysis.clarityScore.toFixed(1)}
                      </td>
                      <td className="py-3 text-sm text-slate-900 text-right font-medium">
                        {analysis.confidenceScore.toFixed(1)}
                      </td>
                      <td className="py-3 text-sm text-slate-900 text-right font-medium">
                        {analysis.engagementScore.toFixed(1)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => router.push(`/report/${analysis.id}`)}
                          className="inline-flex items-center rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-700"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
