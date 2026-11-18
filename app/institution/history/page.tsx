"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, ChevronRight, Search } from "lucide-react";
import { Card } from "@/components/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ToastContext";
import { getWithAuth } from "@/lib/utils/api";
import {
  METRICS,
  fmtScore,
  scoreTone,
  type InstitutionOverview,
} from "@/lib/types/institutionOverview";

/** Every analysed session across the institution's teachers (most recent 100). */
export default function InstitutionSessionsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [overview, setOverview] = useState<InstitutionOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let parsed: any = null;
    try {
      parsed = JSON.parse(localStorage.getItem("shikshanetra_user") || "null");
    } catch {}
    if (!parsed) {
      router.push("/login");
      return;
    }
    if (parsed.role !== "Institution Admin") {
      router.replace("/history");
      return;
    }

    getWithAuth(`/api/institution/${parsed.institutionId}/overview?recent=100`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load sessions");
        setOverview(data);
      })
      .catch((err) => showToast(err.message || "Failed to load sessions"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (overview?.recentSessions ?? []).filter(
      (s) =>
        (teacherFilter === "all" || s.teacherId === teacherFilter) &&
        (!q ||
          s.topic.toLowerCase().includes(q) ||
          (s.subject ?? "").toLowerCase().includes(q) ||
          s.teacherName.toLowerCase().includes(q))
    );
  }, [overview, teacherFilter, query]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Sessions</h1>
        <p className="text-sm text-slate-600">Every classroom session your teachers have analysed</p>
      </div>

      <Card className="overflow-hidden border-slate-200 p-0">
        <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topic, subject or teacher"
              aria-label="Search sessions"
              className="h-9 w-full rounded-lg border border-slate-300 pl-8 pr-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            aria-label="Filter by teacher"
            className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700 outline-none focus:border-primary-500"
          >
            <option value="all">All teachers</option>
            {overview?.teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarClock className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-600">No sessions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Session</th>
                  <th className="px-3 py-3 font-semibold">Teacher</th>
                  <th className="hidden px-3 py-3 font-semibold sm:table-cell">Date</th>
                  {METRICS.map((m) => (
                    <th key={m.key} className="hidden px-3 py-3 text-right font-semibold lg:table-cell">
                      {m.label}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center font-semibold">Avg</th>
                  <th className="px-4 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => router.push(`/report/${s.id}`)}
                    className="cursor-pointer hover:bg-slate-50/60"
                  >
                    <td className="max-w-[16rem] px-4 py-3">
                      <Link href={`/report/${s.id}`} className="block truncate font-medium text-slate-900">
                        {s.topic}
                      </Link>
                      {s.subject && <p className="truncate text-xs text-slate-500">{s.subject}</p>}
                    </td>
                    <td className="px-3 py-3 text-slate-700">{s.teacherName}</td>
                    <td className="hidden whitespace-nowrap px-3 py-3 text-slate-600 sm:table-cell">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    {METRICS.map((m) => (
                      <td key={m.key} className="hidden px-3 py-3 text-right tabular-nums text-slate-600 lg:table-cell">
                        {fmtScore(s.averages[m.key])}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center">
                      {s.status === "completed" ? (
                        <span
                          className={`inline-flex min-w-[3rem] justify-center rounded-md px-2 py-0.5 font-semibold tabular-nums ${scoreTone(s.averages.overall).chip}`}
                        >
                          {fmtScore(s.averages.overall)}
                        </span>
                      ) : (
                        <span className="text-xs font-medium capitalize text-slate-500">{s.status}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
