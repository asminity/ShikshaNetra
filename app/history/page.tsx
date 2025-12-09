"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";

type Analysis = {
  id: string;
  person: string;
  role: string;
  session: string;
  date: string;
  status: "Analyzed" | "In Queue";
  score: number;
  highlights: string[];
};

const historyRows: Analysis[] = [
  {
    id: "ANL-2412-1042",
    person: "Ananya Rao",
    role: "Mentor",
    session: "Data Structures – Trees",
    date: "02 Dec 2025",
    status: "Analyzed",
    score: 88,
    highlights: ["Strong clarity in examples", "Steady confidence", "Engagement spikes during Q&A"],
  },
  {
    id: "ANL-2412-1036",
    person: "Rohit Singh",
    role: "Mentor",
    session: "AI – Search",
    date: "01 Dec 2025",
    status: "Analyzed",
    score: 79,
    highlights: ["Good pacing", "Needs more visual cues", "Interaction steady"],
  },
  {
    id: "ANL-2411-1029",
    person: "Meera Iyer",
    role: "Mentor",
    session: "DBMS – Transactions",
    date: "30 Nov 2025",
    status: "Analyzed",
    score: 91,
    highlights: ["Excellent depth", "Clear explanations", "High confidence"],
  },
  {
    id: "ANL-2411-1024",
    person: "Kunal Shah",
    role: "Mentor",
    session: "OS – Scheduling",
    date: "29 Nov 2025",
    status: "In Queue",
    score: 0,
    highlights: ["Queued for processing"],
  },
];

export default function HistoryPage() {
  const router = useRouter();
  const isClient = typeof window !== "undefined";
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const storageLogin = localStorage.getItem("shikshanetra_logged_in") === "true";
    const cookieLogin = document.cookie.includes("shikshanetra_logged_in=true");
    const loggedIn = storageLogin || cookieLogin;
    if (!loggedIn) {
      router.replace("/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  if (!isClient || !authChecked) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pt-10">
      <PageHeader
        title="Recent Analyses"
        subtitle="Latest people/session analyses with quick highlights. Open details to view full dashboard."
        badge={<span className="badge-pill">History</span>}
      />

      <Card className="mt-4 overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Person</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Session</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Date</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Score</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {historyRows.map((row) => {
              const expanded = expandedId === row.id;
              return (
                <tr key={row.id} className={expanded ? "bg-primary-50/40" : "bg-white"}>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-800">
                    <div className="font-medium">{row.person}</div>
                    <div className="text-[11px] text-slate-500">{row.role}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.session}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.date}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-800">
                    {row.status === "Analyzed" ? (
                      <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                        {row.score}/100
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] ${
                        row.status === "Analyzed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : row.id)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 transition hover:border-primary-300 hover:text-primary-700"
                      >
                        {expanded ? "Hide details" : "View details"}
                      </button>
                      <Link
                        href="/demo"
                        className="rounded-lg bg-primary-600 px-3 py-1.5 text-white transition hover:bg-primary-700"
                      >
                        Open dashboard
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {historyRows.map((row) => {
          const expanded = expandedId === row.id;
          if (!expanded) return null;
          return (
            <div
              key={`${row.id}-details`}
              className="border-t border-primary-100 bg-white/80 px-4 py-4 text-xs sm:text-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-700">
                    {row.id}
                  </p>
                  <p className="text-slate-800">{row.session}</p>
                  <p className="text-[11px] text-slate-500">
                    {row.person} • {row.date} • {row.role}
                  </p>
                </div>
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-3 py-1.5 text-white transition hover:bg-primary-700"
                >
                  Go to full analysis
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {row.highlights.map((h) => (
                  <span
                    key={h}
                    className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-700"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </Card>

      <p className="mt-3 text-[11px] text-slate-500">
        Data is demo/sample. In production this would connect to recent analyses and deep-link into
        each session’s full dashboard.
      </p>
    </div>
  );
}

