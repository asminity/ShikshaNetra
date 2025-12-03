import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";

const kpis = [
  {
    label: "Average Mentor Score",
    value: "84/100",
    description: "Across last 30 evaluated sessions.",
  },
  {
    label: "Sessions Evaluated",
    value: "126",
    description: "Demo count across all cohorts.",
  },
  {
    label: "Active Mentors",
    value: "18",
    description: "Mentors with at least one recent session.",
  },
  {
    label: "Average Engagement Score",
    value: "8.1/10",
    description: "Weighted by student-facing hours.",
  },
];

const recentSessions = [
  {
    date: "02 Dec 2025",
    mentor: "Ananya Rao",
    subject: "Data Structures",
    score: 88,
    status: "Analyzed",
  },
  {
    date: "01 Dec 2025",
    mentor: "Rohit Singh",
    subject: "AI",
    score: 79,
    status: "Analyzed",
  },
  {
    date: "30 Nov 2025",
    mentor: "Meera Iyer",
    subject: "DBMS",
    score: 91,
    status: "Analyzed",
  },
  {
    date: "29 Nov 2025",
    mentor: "Kunal Shah",
    subject: "OS",
    score: 74,
    status: "In Queue",
  },
  {
    date: "29 Nov 2025",
    mentor: "Sneha Gupta",
    subject: "Algorithms",
    score: 82,
    status: "Analyzed",
  },
];

const radarSkills = [
  { label: "Clarity", value: 8.5 },
  { label: "Confidence", value: 8.2 },
  { label: "Engagement", value: 8.0 },
  { label: "Technical Depth", value: 8.7 },
  { label: "Interaction", value: 7.8 },
];

const trendSessions = [
  { label: "Session 1", value: 78 },
  { label: "Session 2", value: 82 },
  { label: "Session 3", value: 80 },
  { label: "Session 4", value: 85 },
  { label: "Session 5", value: 88 },
  { label: "Session 6", value: 86 },
  { label: "Session 7", value: 90 },
];

export default function InsightsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pt-10">
      <PageHeader
        title="Insights & Analytics"
        subtitle="Visual overview of mentor performance and evaluation metrics."
        badge={<span className="badge-pill">Sample analytics</span>}
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
        {/* Radar-like */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Skill Distribution – Sample Mentor
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Static demo view of core signals captured by ShikshaNetra.
          </p>
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
                      {skill.value.toFixed(1)}/10
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-400 to-accent-400"
                      style={{ width: `${(skill.value / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Trend over time */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Scores Across Recent Sessions
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Simple trend view with mocked scores across a mentor&apos;s recent sessions.
          </p>
          <div className="mt-5 flex h-44 items-end gap-2 rounded-xl bg-slate-50 px-4 py-3">
            {trendSessions.map((s) => (
              <div
                key={s.label}
                className="flex flex-1 flex-col items-center justify-end gap-1"
              >
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-primary-500 to-accent-400"
                  style={{ height: `${(s.value / 100) * 90}%` }}
                />
                <span className="text-[10px] text-slate-500">{s.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Recent sessions + Quick insights */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[1.6fr,0.9fr]">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Recent Sessions
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Latest evaluations pulled into a coordinator-friendly view.
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Mentor
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Subject
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Score
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSessions.map((row, idx) => (
                  <tr
                    key={row.date + row.mentor}
                    className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                  >
                    <td className="whitespace-nowrap px-4 py-2 text-slate-700">
                      {row.date}
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Quick Insights
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Narrative-style highlights based on the current sample dataset.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-xs text-slate-700 sm:text-sm">
            <li>
              Engagement scores are strongest in interactive subjects like Data
              Structures and AI lab-style sessions.
            </li>
            <li>
              Confidence tends to dip slightly in advanced topics such as
              optimization and distributed systems.
            </li>
            <li>
              Mentors who recap key ideas every 10–15 minutes show higher
              clarity and retention metrics.
            </li>
            <li>
              Cohorts with more than 3 evaluated sessions per mentor show
              smoother improvement curves over time.
            </li>
          </ul>
        </Card>
      </section>
    </div>
  );
}


