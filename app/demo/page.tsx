"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { useToast } from "@/components/ToastContext";

type Metric = {
  name: string;
  score: number;
  source: string;
};

const mockMetrics: Metric[] = [
  { name: "Clarity", score: 8.1, source: "Audio + Text" },
  { name: "Confidence", score: 8.4, source: "Audio" },
  { name: "Engagement", score: 7.9, source: "Video" },
  { name: "Technical Depth", score: 8.3, source: "Transcript" },
  { name: "Interaction", score: 7.8, source: "Q&A Cues" }
];

const cohortRows = [
  { mentor: "Ananya Rao", subject: "Data Structures", score: 86, sessions: 12, trend: "up" },
  { mentor: "Rohit Singh", subject: "AI", score: 79, sessions: 9, trend: "flat" },
  { mentor: "Meera Iyer", subject: "DBMS", score: 90, sessions: 15, trend: "up" },
  { mentor: "Kunal Shah", subject: "OS", score: 74, sessions: 7, trend: "down" }
];

export default function DemoPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"mentor" | "coordinator">("mentor");
  const [loading, setLoading] = useState(false);
  const [evaluated, setEvaluated] = useState(false);
  const [subject, setSubject] = useState("Data Structures");
  const [language, setLanguage] = useState("English – Indian");
  const [fileName, setFileName] = useState<string | null>(null);

  const handleRunDemo = () => {
    if (loading) return;
    setLoading(true);
    // TODO: Replace mock analysis with API call to /api/analyze-session
    setTimeout(() => {
      setLoading(false);
      setEvaluated(true);
      showToast("Demo analysis completed. Results updated below.");
    }, 1800);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const trendIcon = (trend: string) => {
    if (trend === "up") return "▲";
    if (trend === "down") return "▼";
    return "▬";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pt-10">
      <PageHeader
        title="Live Demo – Mentor Evaluation"
        subtitle="Simulated end-to-end flow: upload a teaching session, run AI analysis, and view results."
        badge={<span className="badge-pill">Interactive prototype</span>}
      />

      {/* Tabs */}
      <div className="mb-6 inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("mentor")}
          className={`rounded-full px-4 py-2 transition ${
            activeTab === "mentor"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Mentor View
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("coordinator")}
          className={`rounded-full px-4 py-2 transition ${
            activeTab === "coordinator"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Coordinator View
        </button>
      </div>

      {activeTab === "mentor" ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          {/* Mentor Panel */}
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              Analyze Your Session (Demo)
            </h2>
            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
              Upload a sample teaching video and run a simulated AI evaluation.
            </p>

            {/* Upload */}
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500 transition hover:border-primary-300 hover:bg-primary-50/60 sm:text-sm">
              <input
                type="file"
                className="hidden"
                accept="video/*"
                onChange={handleFileChange}
              />
              <span className="mb-1 font-medium text-slate-700">
                Drop your lecture video here or click to upload (demo only).
              </span>
              <span className="text-[11px]">
                MP4, MKV, or WebM — 5–60 minutes, classroom or virtual sessions.
              </span>
              {fileName && (
                <span className="mt-2 rounded-full bg-white px-3 py-1 text-[11px] text-primary-700">
                  Selected: {fileName}
                </span>
              )}
            </label>

            {/* Form */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 text-xs sm:text-sm">
                <label className="block text-xs font-medium text-slate-700">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 sm:text-sm"
                >
                  <option>Data Structures</option>
                  <option>AI</option>
                  <option>DBMS</option>
                  <option>OS</option>
                  <option>Algorithms</option>
                </select>
              </div>
              <div className="space-y-1.5 text-xs sm:text-sm">
                <label className="block text-xs font-medium text-slate-700">
                  Language / Accent
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 sm:text-sm"
                >
                  <option>English – Indian</option>
                  <option>English – Neutral</option>
                  <option>English – US</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRunDemo}
                className="btn-primary px-5 py-2 text-xs sm:text-sm"
              >
                {loading ? "Running AI Evaluation…" : "Run AI Evaluation (Demo)"}
              </button>
              <p className="text-[11px] text-slate-500">
                Demo only – analysis is simulated with representative scores.
              </p>
            </div>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Overall Mentor Score
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {evaluated ? "82/100" : "--/100"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Based on last uploaded session ({subject}, {language}).
                  </p>
                </div>
                <div className="flex flex-col items-end text-[11px]">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                    {evaluated ? "Ready" : "Waiting for run"}
                  </span>
                  <span className="mt-1 text-slate-500">
                    Cohort percentile: {evaluated ? "78th" : "--"}
                  </span>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {mockMetrics.map((metric) => (
                  <div
                    key={metric.name}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">
                        {metric.name}
                      </span>
                      <span className="text-[11px] font-semibold text-primary-700">
                        {evaluated ? metric.score.toFixed(1) : "-"}/10
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="mr-2 h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r from-primary-400 to-accent-400 transition-all duration-500 ${
                            evaluated ? "w-[80%]" : "w-0"
                          }`}
                        />
                      </div>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-500">
                        {metric.source}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                AI Feedback Summary (Sample)
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Generated feedback is tailored per session to keep reviews consistent and
                constructive.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Strengths
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700">
                    <li>
                      Concepts were broken into clear, well-paced explanations with minimal filler
                      words.
                    </li>
                    <li>
                      Visual cues and board usage aligned well with verbal explanations, reducing
                      confusion.
                    </li>
                    <li>
                      Maintained a confident tone even when handling student questions.
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent-700">
                    Suggestions
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700">
                    <li>
                      Add short recaps after each major concept to reinforce long topics like trees
                      and graphs.
                    </li>
                    <li>
                      Invite more quick check-in questions to drive interaction and engagement.
                    </li>
                    <li>
                      Slow down slightly when introducing new notation or definitions.
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Cohort Snapshot (Demo)
              </h2>
              <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                View a simulated overview of mentor performance across subjects and batches.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600">
                  Subject
                </label>
                <select className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100">
                  <option>All</option>
                  <option>Data Structures</option>
                  <option>AI</option>
                  <option>DBMS</option>
                  <option>OS</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600">
                  Batch / Department
                </label>
                <select className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100">
                  <option>All</option>
                  <option>CSE 2025</option>
                  <option>ECE 2025</option>
                  <option>AIML 2025</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Mentor Name
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Subject
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Latest Score
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Sessions Evaluated
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cohortRows.map((row) => (
                  <tr key={row.mentor} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-2 text-slate-800">
                      {row.mentor}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                      {row.subject}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-800">
                      <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                        {row.score}/100
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                      {row.sessions}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                          row.trend === "up"
                            ? "bg-emerald-50 text-emerald-700"
                            : row.trend === "down"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-slate-50 text-slate-600"
                        }`}
                      >
                        <span>{trendIcon(row.trend)}</span>
                        <span>
                          {row.trend === "up"
                            ? "Improving"
                            : row.trend === "down"
                            ? "Watchlist"
                            : "Stable"}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11px] text-slate-500">
            Data shown is demo/sample only. In production, this view would connect to aggregated
            mentor evaluation data.
          </p>
        </Card>
      )}
    </div>
  );
}


