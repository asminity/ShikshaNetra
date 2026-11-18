import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { authMiddleware } from "@/lib/middleware/auth";
import { getInstitutionById } from "@/lib/models/Institution";
import { getDatabase } from "@/lib/db/mongodb";

const SCORE_FIELDS = [
  "clarityScore",
  "confidenceScore",
  "engagementScore",
  "technicalDepth",
  "interactionIndex",
] as const;

type ScoreField = (typeof SCORE_FIELDS)[number];
type ScoreAverages = Record<ScoreField, number | null> & { overall: number | null };

const round = (n: number | null | undefined) =>
  typeof n === "number" && !Number.isNaN(n) ? Math.round(n * 10) / 10 : null;

/** Interaction index can exceed 100 from the ML model; clamp it like the teacher dashboard does. */
const scoreExpr = (field: ScoreField) =>
  field === "interactionIndex"
    ? {
        $cond: [
          { $isNumber: `$${field}` },
          { $min: [{ $max: [`$${field}`, 0] }, 100] },
          null, // missing values are skipped by $avg instead of counting as 0
        ],
      }
    : `$${field}`;

const avgGroup = Object.fromEntries(
  SCORE_FIELDS.map((f) => [f, { $avg: scoreExpr(f) }])
);

function toAverages(doc: any): ScoreAverages {
  const values = SCORE_FIELDS.map((f) => {
    const v = doc?.[f];
    return round(f === "interactionIndex" && typeof v === "number" ? Math.min(Math.max(v, 0), 100) : v);
  });
  const present = values.filter((v): v is number => v !== null);
  const overall = present.length
    ? round(present.reduce((a, b) => a + b, 0) / present.length)
    : null;
  return {
    ...(Object.fromEntries(SCORE_FIELDS.map((f, i) => [f, values[i]])) as Record<ScoreField, number | null>),
    overall,
  };
}

/**
 * GET /api/institution/[institutionId]/overview
 * Aggregated, admin-only view of an institution: per-teacher stats,
 * institution-wide averages, monthly trend, subject mix and recent sessions.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { institutionId: string } }
) {
  try {
    const user = authMiddleware(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized - Invalid or missing token" }, { status: 401 });
    }

    const { institutionId } = params;
    if (user.role !== "Institution Admin" || String(user.institutionId) !== String(institutionId)) {
      return NextResponse.json(
        { error: "Forbidden - Only this institution's admin can view the overview" },
        { status: 403 }
      );
    }

    const institution = await getInstitutionById(institutionId);
    if (!institution) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const recentLimit = Math.min(Math.max(parseInt(searchParams.get("recent") || "10") || 10, 1), 100);

    const db = await getDatabase();

    const teacherObjectIds = (institution.userIds || [])
      .map((id) => {
        try {
          return new ObjectId(id);
        } catch {
          return null;
        }
      })
      .filter((id): id is ObjectId => id !== null);

    const teacherDocs = teacherObjectIds.length
      ? await db
          .collection("users")
          .find({ _id: { $in: teacherObjectIds }, role: { $in: ["Mentor", "Coordinator"] } })
          .project({ password: 0 })
          .toArray()
      : [];

    const teacherIds = teacherDocs.map((t: any) => t._id.toString());
    const analyses = db.collection("analyses");

    /*
     * Effective status. Older analyses were saved as "processing" even though the
     * record is only written after the ML run finishes, so a stored ML response
     * (and no failure) means the session really is analysed.
     */
    const withStatus = [
      { $match: { userId: { $in: teacherIds } } },
      {
        $addFields: {
          _status: {
            $switch: {
              branches: [
                {
                  case: {
                    $or: [
                      { $eq: ["$processingStatus.overall", "failed"] },
                      { $eq: ["$status", "failed"] },
                    ],
                  },
                  then: "failed",
                },
                {
                  case: {
                    $or: [
                      { $eq: ["$processingStatus.overall", "completed"] },
                      { $ne: [{ $ifNull: ["$mlResponse", null] }, null] },
                      {
                        $and: [
                          { $eq: [{ $type: "$processingStatus" }, "missing"] },
                          { $eq: [{ $ifNull: ["$status", "completed"] }, "completed"] },
                        ],
                      },
                    ],
                  },
                  then: "completed",
                },
              ],
              default: "processing",
            },
          },
        },
      },
    ];
    const completed = [...withStatus, { $match: { _status: "completed" } }];

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [perTeacher, overallAgg, statusAgg, monthly, subjects, recent] = teacherIds.length
      ? await Promise.all([
          analyses
            .aggregate([
              ...completed,
              {
                $group: {
                  _id: "$userId",
                  sessions: { $sum: 1 },
                  lastSessionAt: { $max: "$createdAt" },
                  ...avgGroup,
                },
              },
            ])
            .toArray(),
          analyses
            .aggregate([...completed, { $group: { _id: null, sessions: { $sum: 1 }, ...avgGroup } }])
            .toArray(),
          analyses
            .aggregate([
              ...withStatus,
              {
                $group: {
                  _id: "$_status",
                  count: { $sum: 1 },
                },
              },
            ])
            .toArray(),
          analyses
            .aggregate([
              ...completed,
              { $match: { createdAt: { $gte: sixMonthsAgo } } },
              {
                $group: {
                  _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                  sessions: { $sum: 1 },
                  ...avgGroup,
                },
              },
              { $sort: { _id: 1 } },
            ])
            .toArray(),
          analyses
            .aggregate([
              ...completed,
              { $group: { _id: { $ifNull: ["$subject", "Other"] }, count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 8 },
            ])
            .toArray(),
          analyses
            .aggregate([
              ...withStatus,
              { $sort: { createdAt: -1 } },
              { $limit: recentLimit },
              {
                $project: {
                  userId: 1,
                  topic: 1,
                  subject: 1,
                  createdAt: 1,
                  _status: 1,
                  ...Object.fromEntries(SCORE_FIELDS.map((f) => [f, 1])),
                },
              },
            ])
            .toArray(),
        ])
      : [[], [], [], [], [], []];

    const teacherById = new Map(teacherDocs.map((t: any) => [t._id.toString(), t]));
    const statsById = new Map(perTeacher.map((s: any) => [s._id, s]));

    const teachers = teacherDocs
      .map((t: any) => {
        const id = t._id.toString();
        const s: any = statsById.get(id);
        return {
          id,
          name: t.name,
          email: t.email,
          role: t.role,
          image: t.image || "",
          joinedAt: t.createdAt,
          sessions: s?.sessions ?? 0,
          lastSessionAt: s?.lastSessionAt ?? null,
          averages: toAverages(s),
        };
      })
      .sort((a, b) => (b.averages.overall ?? -1) - (a.averages.overall ?? -1));

    const statusCounts = Object.fromEntries(statusAgg.map((s: any) => [s._id, s.count]));
    const now = Date.now();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    return NextResponse.json(
      {
        success: true,
        institution: { id: institution.id, name: institution.name, logoUrl: institution.logoUrl },
        totals: {
          teachers: teachers.length,
          activeTeachers30d: teachers.filter(
            (t) => t.lastSessionAt && now - new Date(t.lastSessionAt).getTime() <= THIRTY_DAYS
          ).length,
          completedSessions: overallAgg[0]?.sessions ?? 0,
          processingSessions: statusCounts.processing ?? 0,
          failedSessions: statusCounts.failed ?? 0,
        },
        averages: toAverages(overallAgg[0]),
        monthly: monthly.map((m: any) => ({ month: m._id, sessions: m.sessions, averages: toAverages(m) })),
        subjects: subjects.map((s: any) => ({ subject: s._id, count: s.count })),
        teachers,
        recentSessions: recent.map((a: any) => {
          const t: any = teacherById.get(a.userId);
          return {
            id: a._id.toString(),
            teacherId: a.userId,
            teacherName: t?.name ?? "Unknown",
            topic: a.topic || "Untitled session",
            subject: a.subject,
            createdAt: a.createdAt,
            status: a._status,
            averages: toAverages(a),
          };
        }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error building institution overview:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
