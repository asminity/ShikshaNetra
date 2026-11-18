"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Search,
  Activity,
  Gauge,
  AlertTriangle,
  ChevronRight,
  Trash2,
  X,
  Loader2,
  CalendarClock,
  Building2,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/Card";
import { UserAvatar } from "@/components/UserAvatar";
import { useToast } from "@/components/ToastContext";
import { getWithAuth, postWithAuth } from "@/lib/utils/api";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  METRICS,
  fmtScore,
  relativeDays,
  scoreTone,
  type InstitutionOverview,
  type OverviewTeacher,
} from "@/lib/types/institutionOverview";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  institutionId?: string;
}

type SortKey = "score" | "sessions" | "recent" | "name";

const ATTENTION_SCORE = 55;
const INACTIVE_DAYS = 30;

function isInactive(t: OverviewTeacher) {
  if (!t.lastSessionAt) return true;
  return Date.now() - new Date(t.lastSessionAt).getTime() > INACTIVE_DAYS * 86_400_000;
}

/** Reason a teacher needs a look, or null if they're doing fine. */
function attentionReason(t: OverviewTeacher): string | null {
  if (t.sessions === 0) return "No sessions analysed yet";
  if (t.averages.overall != null && t.averages.overall < ATTENTION_SCORE)
    return `Average score ${fmtScore(t.averages.overall)}`;
  if (isInactive(t)) return `No sessions in ${INACTIVE_DAYS}+ days`;
  return null;
}

function weakestMetric(t: OverviewTeacher) {
  let weakest: { label: string; value: number } | null = null;
  for (const m of METRICS) {
    const v = t.averages[m.key];
    if (v != null && (!weakest || v < weakest.value)) weakest = { label: m.label, value: v };
  }
  return weakest;
}

function lastSixMonths(monthly: InstitutionOverview["monthly"]) {
  const byMonth = new Map(monthly.map((m) => [m.month, m]));
  const out: { key: string; label: string; sessions: number; overall: number | null }[] = [];
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 5);
  for (let i = 0; i < 6; i++) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const m = byMonth.get(key);
    out.push({
      key,
      label: d.toLocaleString(undefined, { month: "short" }),
      sessions: m?.sessions ?? 0,
      overall: m?.averages.overall ?? null,
    });
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "text-slate-900",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon: ReactNode;
  tone?: string;
}) {
  return (
    <Card className="border-slate-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <span className="text-slate-400">{icon}</span>
      </div>
      <p className={`mt-3 text-3xl font-bold tracking-tight tabular-nums ${tone}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}

function ScoreChip({ score }: { score: number | null }) {
  const tone = scoreTone(score);
  return (
    <span className={`inline-flex min-w-[3rem] justify-center rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums ${tone.chip}`}>
      {fmtScore(score)}
    </span>
  );
}

function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Skeleton className="mb-2 h-8 w-64" />
      <Skeleton className="mb-8 h-4 w-48" />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

export default function InstitutionDashboardPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [overview, setOverview] = useState<InstitutionOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");

  const [showAddForm, setShowAddForm] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("shikshanetra_token");
    const loggedIn = localStorage.getItem("shikshanetra_logged_in") === "true";
    if (!token && !loggedIn) {
      showToast("Please login to access dashboard");
      router.push("/login");
      return;
    }

    try {
      const parsed = JSON.parse(localStorage.getItem("shikshanetra_user") || "null");
      if (!parsed) {
        router.push("/login");
        return;
      }
      if (parsed.role !== "Institution Admin") {
        router.replace("/dashboard");
        return;
      }
      if (!parsed.institutionId) {
        showToast("Your session is missing institution details — please sign in again");
        localStorage.removeItem("shikshanetra_token");
        localStorage.removeItem("shikshanetra_user");
        localStorage.removeItem("shikshanetra_logged_in");
        router.push("/login");
        return;
      }
      setUser(parsed);
      loadOverview(parsed.institutionId);
    } catch {
      router.push("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadOverview(institutionId: string, opts: { quiet?: boolean } = {}) {
    if (opts.quiet) setRefreshing(true);
    setLoadError("");
    try {
      const res = await getWithAuth(`/api/institution/${institutionId}/overview?recent=8`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load institution overview");
      setOverview(data);
    } catch (err) {
      console.error("Institution overview error:", err);
      setLoadError(err instanceof Error ? err.message : "Failed to load institution overview");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleAddTeacher(e: React.FormEvent) {
    e.preventDefault();
    const email = addEmail.trim();
    if (!email || !user?.institutionId) return;
    setAdding(true);
    try {
      const res = await postWithAuth(`/api/institution/${user.institutionId}/teachers/add`, { email });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to add teacher");
        return;
      }
      showToast("Teacher added to your institution");
      setAddEmail("");
      setShowAddForm(false);
      loadOverview(user.institutionId, { quiet: true });
    } catch {
      showToast("Failed to add teacher");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveTeacher(teacher: OverviewTeacher) {
    if (!user?.institutionId) return;
    setRemoving(teacher.id);
    try {
      const res = await postWithAuth(`/api/institution/${user.institutionId}/teachers/remove`, {
        email: teacher.email,
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to remove teacher");
        return;
      }
      showToast(`${teacher.name} removed from your institution`);
      setConfirmRemove(null);
      loadOverview(user.institutionId, { quiet: true });
    } catch {
      showToast("Failed to remove teacher");
    } finally {
      setRemoving(null);
    }
  }

  const teachers = useMemo(() => {
    if (!overview) return [];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? overview.teachers.filter((t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q))
      : overview.teachers;
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sortKey) {
        case "sessions":
          return b.sessions - a.sessions;
        case "recent":
          return (b.lastSessionAt ? Date.parse(b.lastSessionAt) : 0) - (a.lastSessionAt ? Date.parse(a.lastSessionAt) : 0);
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return (b.averages.overall ?? -1) - (a.averages.overall ?? -1);
      }
    });
    return sorted;
  }, [overview, query, sortKey]);

  const attention = useMemo(
    () =>
      (overview?.teachers ?? [])
        .map((t) => ({ teacher: t, reason: attentionReason(t) }))
        .filter((x): x is { teacher: OverviewTeacher; reason: string } => x.reason !== null),
    [overview]
  );

  const months = useMemo(() => lastSixMonths(overview?.monthly ?? []), [overview]);
  const maxMonthSessions = Math.max(1, ...months.map((m) => m.sessions));

  if (loading) return <DashboardLoading />;

  if (!overview) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-500" />
        <h1 className="text-lg font-semibold text-slate-900">Couldn&apos;t load your institution</h1>
        <p className="mt-1 text-sm text-slate-600">{loadError}</p>
        <button
          onClick={() => {
            setLoading(true);
            if (user?.institutionId) loadOverview(user.institutionId);
          }}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </div>
    );
  }

  const { totals, averages, institution, subjects, recentSessions } = overview;
  const hasTeachers = totals.teachers > 0;
  const hasSessions = totals.completedSessions > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar
            image={institution.logoUrl}
            name={institution.name}
            className="h-12 w-12 bg-primary-50 text-primary-700"
            fallback={<Building2 className="h-6 w-6" />}
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{institution.name}</h1>
            <p className="text-sm text-slate-600">
              Institution overview · signed in as {user?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => user?.institutionId && loadOverview(user.institutionId, { quiet: true })}
            disabled={refreshing}
            aria-label="Refresh"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <UserPlus className="h-4 w-4" /> Add teacher
          </button>
        </div>
      </div>

      {/* Add teacher */}
      {showAddForm && (
        <Card className="mb-6 border-slate-200 p-5">
          <form onSubmit={handleAddTeacher} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="add-teacher" className="mb-1.5 block text-sm font-medium text-slate-700">
                Teacher&apos;s email
              </label>
              <input
                id="add-teacher"
                type="email"
                required
                autoFocus
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="teacher@school.edu"
                disabled={adding}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                The teacher needs a ShikshaNetra account first. Their analysed sessions will appear here once added.
              </p>
            </div>
            <div className="flex gap-2 sm:pb-6">
              <button
                type="submit"
                disabled={adding || !addEmail.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary-600 px-4 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
              >
                {adding && <Loader2 className="h-4 w-4 animate-spin" />} Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setAddEmail("");
                }}
                className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Teachers"
          value={totals.teachers}
          sub={`${totals.activeTeachers30d} active in the last 30 days`}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Sessions analysed"
          value={totals.completedSessions}
          sub={
            totals.processingSessions || totals.failedSessions
              ? `${totals.processingSessions} processing · ${totals.failedSessions} failed`
              : "All sessions processed"
          }
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          label="Institution average"
          value={fmtScore(averages.overall)}
          sub="Across all metrics, out of 100"
          icon={<Gauge className="h-5 w-5" />}
          tone={scoreTone(averages.overall).text}
        />
        <StatCard
          label="Needs attention"
          value={attention.length}
          sub={attention.length ? "Teachers to follow up with" : "Everyone is on track"}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone={attention.length ? "text-amber-700" : "text-emerald-700"}
        />
      </div>

      {!hasTeachers ? (
        <Card className="border-dashed border-slate-300 p-10 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h2 className="text-lg font-semibold text-slate-900">Add your first teacher</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            Teachers upload and analyse their own classroom sessions. Once they&apos;re part of your institution,
            their scores, trends and reports show up here.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <UserPlus className="h-4 w-4" /> Add teacher
          </button>
        </Card>
      ) : (
        <>
          {/* Skill profile + activity */}
          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <Card className="border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900">Teaching skill profile</h2>
              <p className="mb-5 text-sm text-slate-500">Institution-wide averages across analysed sessions</p>
              {hasSessions ? (
                <ul className="space-y-4">
                  {METRICS.map((m) => {
                    const v = averages[m.key];
                    const tone = scoreTone(v);
                    return (
                      <li key={m.key}>
                        <div className="mb-1.5 flex items-baseline justify-between text-sm">
                          <span className="font-medium text-slate-700">{m.label}</span>
                          <span className={`font-semibold tabular-nums ${tone.text}`}>{fmtScore(v)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${tone.bar}`}
                            style={{ width: `${Math.min(v ?? 0, 100)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="py-10 text-center text-sm text-slate-500">No analysed sessions yet.</p>
              )}
            </Card>

            <Card className="border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-900">Activity</h2>
              <p className="mb-5 text-sm text-slate-500">Sessions analysed per month, with average score</p>
              <div className="flex h-40 items-end gap-3" role="img" aria-label="Sessions per month for the last six months">
                {months.map((m) => (
                  <div key={m.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <span className="text-xs font-semibold tabular-nums text-slate-700">{m.sessions || ""}</span>
                    <div
                      className={`w-full max-w-[2.5rem] rounded-t-md ${m.sessions ? scoreTone(m.overall).bar : "bg-slate-100"}`}
                      style={{ height: `${Math.max((m.sessions / maxMonthSessions) * 100, m.sessions ? 6 : 3)}%` }}
                      title={`${m.sessions} sessions · avg ${fmtScore(m.overall)}`}
                    />
                    <span className="text-xs text-slate-500">{m.label}</span>
                  </div>
                ))}
              </div>
              {subjects.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Subjects</p>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((s) => (
                      <span key={s.subject} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {s.subject} <span className="text-slate-400">· {s.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Teachers table */}
            <Card className="overflow-hidden border-slate-200 p-0 lg:col-span-2">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Teachers</h2>
                  <p className="text-sm text-slate-500">{totals.teachers} in your institution</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search"
                      aria-label="Search teachers"
                      className="h-9 w-40 rounded-lg border border-slate-300 pl-8 pr-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                    aria-label="Sort teachers"
                    className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700 outline-none focus:border-primary-500"
                  >
                    <option value="score">Top score</option>
                    <option value="sessions">Most sessions</option>
                    <option value="recent">Recently active</option>
                    <option value="name">Name</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Teacher</th>
                      <th className="px-3 py-3 text-right font-semibold">Sessions</th>
                      <th className="px-3 py-3 text-center font-semibold">Avg</th>
                      <th className="hidden px-3 py-3 font-semibold md:table-cell">Focus area</th>
                      <th className="hidden px-3 py-3 font-semibold sm:table-cell">Last active</th>
                      <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teachers.map((t) => {
                      const weak = weakestMetric(t);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/60">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <UserAvatar image={t.image} name={t.name} className="h-9 w-9 bg-slate-100 text-sm font-semibold text-slate-600" />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-900">{t.name}</p>
                                <p className="truncate text-xs text-slate-500">{t.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-slate-700">{t.sessions}</td>
                          <td className="px-3 py-3 text-center">
                            <ScoreChip score={t.averages.overall} />
                          </td>
                          <td className="hidden px-3 py-3 text-slate-600 md:table-cell">
                            {weak ? (
                              <span>
                                {weak.label} <span className="tabular-nums text-slate-400">({weak.value.toFixed(0)})</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className={`hidden px-3 py-3 sm:table-cell ${isInactive(t) ? "text-amber-700" : "text-slate-600"}`}>
                            {relativeDays(t.lastSessionAt)}
                          </td>
                          <td className="px-5 py-3">
                            {confirmRemove === t.id ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="hidden text-xs text-slate-500 lg:inline">Remove?</span>
                                <button
                                  onClick={() => handleRemoveTeacher(t)}
                                  disabled={removing === t.id}
                                  className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                                >
                                  {removing === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Remove"}
                                </button>
                                <button
                                  onClick={() => setConfirmRemove(null)}
                                  aria-label="Cancel"
                                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <Link
                                  href={`/institution/summaries/${t.id}`}
                                  className="inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-sm font-medium text-primary-700 hover:bg-primary-50"
                                >
                                  Insights <ChevronRight className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() => setConfirmRemove(t.id)}
                                  aria-label={`Remove ${t.name}`}
                                  className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {teachers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                          No teachers match &ldquo;{query}&rdquo;.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Right column: attention + recent sessions */}
            <div className="space-y-4">
              <Card className="border-slate-200 p-5">
                <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Needs attention
                </h2>
                {attention.length === 0 ? (
                  <p className="text-sm text-slate-500">No teachers flagged. Nice work.</p>
                ) : (
                  <ul className="space-y-1">
                    {attention.slice(0, 6).map(({ teacher, reason }) => (
                      <li key={teacher.id}>
                        <Link
                          href={`/institution/summaries/${teacher.id}`}
                          className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{teacher.name}</p>
                            <p className="truncate text-xs text-amber-700">{reason}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="border-slate-200 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <CalendarClock className="h-4 w-4 text-slate-400" /> Recent sessions
                  </h2>
                  <Link href="/institution/history" className="text-sm font-medium text-primary-700 hover:text-primary-800">
                    View all
                  </Link>
                </div>
                {recentSessions.length === 0 ? (
                  <p className="text-sm text-slate-500">No sessions uploaded yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {recentSessions.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/report/${s.id}`}
                          className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{s.topic}</p>
                            <p className="truncate text-xs text-slate-500">
                              {s.teacherName} · {relativeDays(s.createdAt)}
                            </p>
                          </div>
                          {s.status === "completed" ? (
                            <ScoreChip score={s.averages.overall} />
                          ) : (
                            <span
                              className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium capitalize ${
                                s.status === "failed" ? "bg-rose-50 text-rose-700" : "bg-sky-50 text-sky-700"
                              }`}
                            >
                              {s.status}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
