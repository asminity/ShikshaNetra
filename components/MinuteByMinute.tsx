"use client";

import { Card } from "./Card";
import type { TimeSegment } from "./TimeSegments";
import { Play } from "lucide-react";

export interface AudioMinute {
  minute: number;
  start_sec?: number;
  end_sec?: number;
  clarity_score?: number;
  confidence_score?: number;
}

export interface VideoMinute {
  minute: number;
  start_sec?: number;
  end_sec?: number;
  engagement_score?: number;
  gesture_index?: number;
  dominant_emotion?: string;
  confidence_score?: number;
}

type Level = "good" | "fair" | "low";

/** Same bands the ShikshaNetra model uses: 70+ strong, 40-69 fair, under 40 needs attention. */
function level(score: number): { key: Level; label: string } {
  if (score >= 70) return { key: "good", label: "Strong" };
  if (score >= 40) return { key: "fair", label: "Fair" };
  return { key: "low", label: "Needs attention" };
}

const FILL: Record<Level, string> = {
  good: "bg-emerald-500",
  fair: "bg-amber-400",
  low: "bg-rose-500",
};

const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : Number(v);
  return v === undefined || v === null || Number.isNaN(n) ? null : n;
};

export const clock = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Joins audio and video per-minute rows on their minute index. */
function buildMinutes(audio: AudioMinute[] = [], video: VideoMinute[] = []) {
  const a = new Map(audio.map((m) => [m.minute, m]));
  const v = new Map(video.map((m) => [m.minute, m]));
  const minutes = Array.from(new Set([...a.keys(), ...v.keys()])).sort((x, y) => x - y);

  return minutes.map((minute) => {
    const am = a.get(minute);
    const vm = v.get(minute);
    const start = num(am?.start_sec) ?? num(vm?.start_sec) ?? minute * 60;
    const end = num(am?.end_sec) ?? num(vm?.end_sec) ?? (minute + 1) * 60;
    return {
      minute,
      start,
      end,
      span: `${clock(start)}–${clock(end)}`,
      clarity: num(am?.clarity_score),
      voiceConfidence: num(am?.confidence_score),
      engagement: num(vm?.engagement_score),
      movement: num(vm?.gesture_index),
      emotion: vm ? vm.dominant_emotion || "neutral" : null,
    };
  });
}

type Row = ReturnType<typeof buildMinutes>[number];

function extremes(rows: Row[]) {
  const withClarity = rows.filter((r) => r.clarity !== null);
  let best: Row | null = null;
  let worst: Row | null = null;
  if (withClarity.length > 1) {
    best = withClarity.reduce((p, c) => (c.clarity! > p.clarity! ? c : p));
    worst = withClarity.reduce((p, c) => (c.clarity! < p.clarity! ? c : p));
    if (best.minute === worst.minute) best = worst = null;
  }
  const withEngagement = rows.filter((r) => r.engagement !== null);
  let engaged: Row | null = null;
  if (withEngagement.length) {
    const top = withEngagement.reduce((p, c) => (c.engagement! > p.engagement! ? c : p));
    if (top.engagement! > 0) engaged = top;
  }
  return { best, worst, engaged };
}

/** Key moments for the video sidebar, derived from the real per-minute scores. */
export function minuteMoments(audio?: AudioMinute[], video?: VideoMinute[]): TimeSegment[] {
  const rows = buildMinutes(audio, video);
  const { best, worst, engaged } = extremes(rows);
  const segments: TimeSegment[] = [];

  if (best) {
    segments.push({
      startTime: best.start,
      endTime: best.end,
      label: "Clearest minute",
      type: "highlight",
      description: `Voice clarity peaked at ${Math.round(best.clarity!)}. Worth rewatching as a model for the rest of the lesson.`,
    });
  }
  if (engaged) {
    segments.push({
      startTime: engaged.start,
      endTime: engaged.end,
      label: "Most engaged minute",
      type: "highlight",
      description: `Engagement reached ${Math.round(engaged.engagement!)}, with a mostly ${engaged.emotion ?? "neutral"} expression.`,
    });
  }
  if (worst) {
    segments.push({
      startTime: worst.start,
      endTime: worst.end,
      label: "Least clear minute",
      type: worst.clarity! < 40 ? "issue" : "warning",
      description: `Voice clarity dropped to ${Math.round(worst.clarity!)}. Check pace and articulation here.`,
    });
  }
  for (const r of rows) {
    if (r.minute === worst?.minute) continue;
    if (r.engagement !== null && r.engagement < 40) {
      segments.push({
        startTime: r.start,
        endTime: r.end,
        label: "Low engagement",
        type: "warning",
        description: `Engagement was ${Math.round(r.engagement)} in this minute.`,
      });
    }
  }
  return segments.sort((x, y) => x.startTime - y.startTime);
}

function Trend({ label, rows, pick }: { label: string; rows: Row[]; pick: (r: Row) => number | null }) {
  const values = rows.map(pick).filter((v): v is number => v !== null);
  if (!values.length) return null;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold text-slate-800">{label}</span>
        <span className="text-xs text-slate-500">
          avg <span className="font-semibold tabular-nums text-slate-800">{Math.round(avg)}</span> · {level(avg).label}
        </span>
      </div>
      <div
        className="relative flex h-24 items-end gap-1"
        role="img"
        aria-label={`${label} by minute, average ${Math.round(avg)}`}
      >
        <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-slate-300" style={{ bottom: "70%" }} />
        {rows.map((r) => {
          const v = pick(r);
          return (
            <div key={r.minute} className="group relative flex h-full flex-1 items-end" title={v === null ? `${r.span}: no data` : `${r.span} · ${Math.round(v)} (${level(v).label})`}>
              {v !== null && (
                <span
                  className={`w-full rounded-t ${FILL[level(v).key]} opacity-85 transition-opacity group-hover:opacity-100`}
                  style={{ height: `${Math.max(2, Math.min(100, v))}%` }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-slate-400">
        <span>{rows[0].span.split("–")[0]}</span>
        <span>{rows[rows.length - 1].span.split("–")[1]}</span>
      </div>
    </div>
  );
}

function ScoreCell({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="min-w-0">
      <span className="mb-0.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400 md:hidden">{label}</span>
      {value === null ? (
        <span className="text-xs text-slate-400">no data</span>
      ) : (
        <div title={`${label}: ${Math.round(value)} (${level(value).label})`}>
          <span className="text-sm font-semibold tabular-nums text-slate-800">{Math.round(value)}</span>
          <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${FILL[level(value).key]}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function Callout({
  tone,
  title,
  row,
  detail,
  onSeek,
}: {
  tone: "good" | "low" | "neutral";
  title: string;
  row: Row;
  detail: string;
  onSeek?: (sec: number) => void;
}) {
  const dot = { good: "bg-emerald-500", low: "bg-rose-500", neutral: "bg-indigo-400" }[tone];
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
        <i className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
        {title}
      </span>
      <span className="mt-1 block text-xl font-bold tabular-nums text-slate-900">{row.span}</span>
      <span className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600">
        {detail}
        {onSeek && <Play className="h-3.5 w-3.5 text-slate-400" aria-hidden />}
      </span>
    </>
  );
  const cls = "block w-full rounded-xl border border-slate-200 bg-white p-4 text-left";
  return onSeek ? (
    <button type="button" onClick={() => onSeek(row.start)} className={`${cls} transition-shadow hover:shadow-md`} aria-label={`${title}, ${row.span}. Play from here`}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function MinuteByMinute({
  audioPerMinute,
  videoPerMinute,
  onSeek,
}: {
  audioPerMinute?: AudioMinute[];
  videoPerMinute?: VideoMinute[];
  /** Called with a start time in seconds when a minute is clicked. Omit to make minutes non-interactive. */
  onSeek?: (seconds: number) => void;
}) {
  const rows = buildMinutes(audioPerMinute, videoPerMinute);

  if (!rows.length) {
    return (
      <Card className="border-slate-200 p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Minute by minute</h2>
        <p className="mt-1 text-sm text-slate-500">This analysis did not include per-minute scores.</p>
      </Card>
    );
  }

  const { best, worst, engaged } = extremes(rows);
  const largestMovement = Math.max(0, ...rows.map((r) => r.movement ?? 0));

  return (
    <Card className="border-slate-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Minute by minute</h2>
        <p className="text-sm text-slate-500">
          How each minute of the lesson scored{onSeek ? ". Select a minute to play the recording from there." : "."}
        </p>
      </div>

      {(best || engaged) && (
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {best && <Callout tone="good" title="Clearest minute" row={best} detail={`clarity ${Math.round(best.clarity!)}`} onSeek={onSeek} />}
          {worst && <Callout tone="low" title="Least clear minute" row={worst} detail={`clarity ${Math.round(worst.clarity!)}`} onSeek={onSeek} />}
          {engaged && <Callout tone="neutral" title="Most engaged minute" row={engaged} detail={`engagement ${Math.round(engaged.engagement!)}`} onSeek={onSeek} />}
        </div>
      )}

      <h3 className="mb-3 text-base font-semibold text-slate-900">How the lesson moved</h3>
      <div className="mb-8 grid gap-3 md:grid-cols-3">
        <Trend label="Clarity" rows={rows} pick={(r) => r.clarity} />
        <Trend label="Voice confidence" rows={rows} pick={(r) => r.voiceConfidence} />
        <Trend label="Engagement" rows={rows} pick={(r) => r.engagement} />
      </div>

      <h3 className="mb-3 text-base font-semibold text-slate-900">Every minute</h3>
      <div role="table" aria-label="Scores for each minute" className="overflow-hidden rounded-xl border border-slate-200">
        <div
          role="row"
          className="hidden grid-cols-[minmax(130px,1.2fr)_repeat(4,minmax(0,1fr))_minmax(90px,0.8fr)] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid"
        >
          <span role="columnheader">Minute</span>
          <span role="columnheader">Clarity</span>
          <span role="columnheader">Voice confidence</span>
          <span role="columnheader">Engagement</span>
          <span role="columnheader">Hand movement</span>
          <span role="columnheader">Expression</span>
        </div>
        {rows.map((r) => {
          const mark = r.minute === best?.minute ? "best" : r.minute === worst?.minute ? "worst" : "";
          return (
            <div
              key={r.minute}
              role="row"
              className={`grid grid-cols-2 gap-x-4 gap-y-3 border-b border-slate-100 px-4 py-3 last:border-b-0 md:grid-cols-[minmax(130px,1.2fr)_repeat(4,minmax(0,1fr))_minmax(90px,0.8fr)] md:items-center ${
                mark === "best" ? "bg-emerald-50/50" : mark === "worst" ? "bg-rose-50/50" : ""
              }`}
            >
              <div role="rowheader" className="col-span-2 flex flex-wrap items-center gap-2 md:col-span-1">
                {onSeek ? (
                  <button
                    type="button"
                    onClick={() => onSeek(r.start)}
                    className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 -ml-1.5 text-sm font-semibold tabular-nums text-slate-900 hover:bg-slate-100 hover:text-primary-600"
                    aria-label={`Play from ${clock(r.start)}`}
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden />
                    {r.span}
                  </button>
                ) : (
                  <span className="text-sm font-semibold tabular-nums text-slate-900">{r.span}</span>
                )}
                {mark === "best" && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">▲ Clearest</span>}
                {mark === "worst" && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">▼ Least clear</span>}
              </div>
              <ScoreCell label="Clarity" value={r.clarity} />
              <ScoreCell label="Voice confidence" value={r.voiceConfidence} />
              <ScoreCell label="Engagement" value={r.engagement} />
              <div className="min-w-0">
                <span className="mb-0.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400 md:hidden">Hand movement</span>
                {r.movement === null ? (
                  <span className="text-xs text-slate-400">no data</span>
                ) : (
                  <div title={`Hand movement: ${Math.round(r.movement)} (not graded)`}>
                    <span className="text-sm font-semibold tabular-nums text-slate-800">{Math.round(r.movement)}</span>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-slate-400" style={{ width: `${largestMovement > 0 ? (r.movement / largestMovement) * 100 : 0}%` }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="col-span-2 md:col-span-1">
                <span className="mb-0.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400 md:hidden">Expression</span>
                {r.emotion ? (
                  <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700">{r.emotion}</span>
                ) : (
                  <span className="text-xs text-slate-400">no data</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Strong (70+)</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-amber-400" />Fair (40–69)</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-rose-500" />Needs attention (under 40)</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-slate-400" />Hand movement, not graded</span>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Scores run from 0 to 100; the dashed line in each chart marks 70. Hand movement is scaled to this lesson&apos;s busiest minute.
      </p>
    </Card>
  );
}
