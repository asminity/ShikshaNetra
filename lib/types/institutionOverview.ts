/** Shape returned by GET /api/institution/[institutionId]/overview */

export interface ScoreAverages {
  clarityScore: number | null;
  confidenceScore: number | null;
  engagementScore: number | null;
  technicalDepth: number | null;
  interactionIndex: number | null;
  overall: number | null;
}

export interface OverviewTeacher {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string;
  joinedAt?: string;
  sessions: number;
  lastSessionAt: string | null;
  averages: ScoreAverages;
}

export interface OverviewSession {
  id: string;
  teacherId: string;
  teacherName: string;
  topic: string;
  subject?: string;
  createdAt: string;
  status: string;
  averages: ScoreAverages;
}

export interface InstitutionOverview {
  institution: { id: string; name: string; logoUrl?: string };
  totals: {
    teachers: number;
    activeTeachers30d: number;
    completedSessions: number;
    processingSessions: number;
    failedSessions: number;
  };
  averages: ScoreAverages;
  monthly: { month: string; sessions: number; averages: ScoreAverages }[];
  subjects: { subject: string; count: number }[];
  teachers: OverviewTeacher[];
  recentSessions: OverviewSession[];
}

export const METRICS: { key: keyof Omit<ScoreAverages, "overall">; label: string }[] = [
  { key: "clarityScore", label: "Clarity" },
  { key: "confidenceScore", label: "Confidence" },
  { key: "engagementScore", label: "Engagement" },
  { key: "technicalDepth", label: "Technical depth" },
  { key: "interactionIndex", label: "Interaction" },
];

export function scoreTone(score: number | null | undefined) {
  if (score == null) return { text: "text-slate-400", bar: "bg-slate-300", chip: "bg-slate-100 text-slate-500" };
  if (score >= 75) return { text: "text-emerald-700", bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" };
  if (score >= 55) return { text: "text-amber-700", bar: "bg-amber-500", chip: "bg-amber-50 text-amber-700" };
  return { text: "text-rose-700", bar: "bg-rose-500", chip: "bg-rose-50 text-rose-700" };
}

export const fmtScore = (n: number | null | undefined) => (n == null ? "—" : n.toFixed(1));

export function relativeDays(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}
