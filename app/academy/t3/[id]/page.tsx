'use client';

import { useState } from 'react';

const SESSION = null;

function ScoreBar({ score, max, pass }: { score: number; max: number; pass: boolean }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{score}/{max}</span>
        <span className={`font-semibold ${pass ? 'text-emerald-400' : 'text-red-400'}`}>{pass ? 'Pass' : 'Fail'}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${pass ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function T3SessionPage() {
  const [editDay, setEditDay] = useState<number | null>(null);

  if (!SESSION) {
    return (
      <div className="py-24 text-center text-slate-500 text-sm">No T3 certification data.</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">T3 Session — {SESSION.partner}</h1>
          <p className="mt-0.5 text-sm text-slate-500">{SESSION.partnerId} · Trainer: {SESSION.trainer}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
            {SESSION.overall}
          </span>
          {SESSION.certId && (
            <button className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition">
              Download Certificate
            </button>
          )}
        </div>
      </div>

      {/* Cert summary */}
      {SESSION.certId && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Certificate ID', value: SESSION.certId },
            { label: 'Issued',         value: SESSION.issued },
            { label: 'Valid Until',    value: SESSION.expiry },
            { label: 'T3 Fee',        value: SESSION.feeWaived ? 'Waived (first partner)' : 'Paid' },
          ].map(c => (
            <div key={c.label} className="text-center">
              <p className="text-[10px] uppercase tracking-wide text-slate-500">{c.label}</p>
              <p className="mt-0.5 text-xs font-semibold text-emerald-300">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Day cards */}
      <div className="space-y-4">
        {SESSION.days.map(day => (
          <div key={day.number} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${day.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {day.passed ? '✓' : day.number}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Day {day.number} — {day.title}</p>
                  <p className="text-xs text-slate-500">{day.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-[9px] font-semibold ${day.attended ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  {day.attended ? 'Attended' : 'Absent'}
                </span>
                <button onClick={() => setEditDay(editDay === day.number ? null : day.number)}
                  className="rounded px-2 py-1 text-[10px] text-slate-500 border border-slate-700 hover:bg-slate-800 transition">
                  {editDay === day.number ? 'Close' : 'Edit'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1.5">Assessment Score</p>
                <ScoreBar score={day.assessmentScore} max={day.assessmentMax} pass={day.passed} />
                <p className="mt-1 text-[10px] text-slate-600">Pass mark: {day.passMark}/{day.assessmentMax}</p>
              </div>
              {'deliveryRubricScore' in day && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1.5">Delivery Rubric</p>
                  <ScoreBar score={day.deliveryRubricScore!} max={day.deliveryRubricMax!} pass={day.deliveryRubricScore! >= 3.5} />
                </div>
              )}
              {'liveDemoRating' in day && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1.5">Live Demo Rating</p>
                  <ScoreBar score={day.liveDemoRating!} max={day.liveDemoMax!} pass={day.liveDemoRating! >= 3.5} />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              {day.topics.map(t => (
                <span key={t} className="rounded px-2 py-0.5 text-[9px] bg-slate-800 text-slate-400">{t}</span>
              ))}
            </div>

            {day.notes && (
              <div className="rounded-lg border border-slate-800/60 bg-slate-900/30 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">Trainer Notes</p>
                <p className="text-xs text-slate-400">{day.notes}</p>
              </div>
            )}

            {editDay === day.number && (
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
                <p className="text-xs font-semibold text-indigo-300">Edit Day {day.number} Results</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Assessment Score</label>
                    <input type="number" defaultValue={day.assessmentScore} min={0} max={day.assessmentMax}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Attendance</label>
                    <select defaultValue={day.attended ? 'yes' : 'no'}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                      <option value="yes">Attended</option>
                      <option value="no">Absent</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Trainer Notes</label>
                  <textarea defaultValue={day.notes} rows={2}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition">
                  Save Day {day.number}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Issue certificate */}
      {!SESSION.certId && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-200">All 3 days completed — ready to certify</p>
            <p className="text-xs text-slate-500 mt-0.5">Certificate will be emailed as PDF + LinkedIn-ready format within 24 hours</p>
          </div>
          <button className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition">
            Issue T3 Certificate
          </button>
        </div>
      )}
    </div>
  );
}
