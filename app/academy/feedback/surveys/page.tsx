'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Survey {
  id: string;
  name: string;
  program: string;
  type: string;
  trigger: string;
  response_rate: number;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  'Post-Session': 'bg-violet-500/15 text-violet-300',
  'Post-Program': 'bg-indigo-500/15 text-indigo-300',
};

const TRIGGER_COLORS: Record<string, string> = {
  Auto:   'bg-emerald-500/15 text-emerald-300',
  Manual: 'bg-amber-500/15 text-amber-300',
};

type QuestionType = 'nps' | 'text' | 'trainer-rating' | 'multiple-choice';

interface Question {
  id: string;
  type: QuestionType;
  label: string;
  choices?: string[];
}

const Q_TYPE_LABELS: Record<QuestionType, string> = {
  nps: 'NPS Slider (0–10)',
  text: 'Open Text',
  'trainer-rating': 'Trainer Rating',
  'multiple-choice': 'Multiple Choice',
};

export default function SurveysPage() {
  const [surveys, setSurveys]   = useState<Survey[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [surveyName, setSurveyName] = useState('');
  const [surveyType, setSurveyType] = useState<'Post-Session' | 'Post-Program'>('Post-Session');
  const [triggerType, setTriggerType] = useState<'Auto' | 'Manual'>('Auto');
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', type: 'nps', label: 'How likely are you to recommend EPR Academy to a colleague? (0–10)' },
    { id: '2', type: 'trainer-rating', label: "How would you rate today's trainer?" },
    { id: '3', type: 'text', label: 'What did you like most about this session?' },
  ]);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetch('/api/academy/surveys')
      .then(r => r.json())
      .then(d => setSurveys(d.surveys ?? []))
      .catch(() => setSurveys([]))
      .finally(() => setLoading(false));
  }, []);

  function addQuestion(type: QuestionType) {
    const defaults: Record<QuestionType, string> = {
      nps: 'Rate your overall experience (0–10)',
      text: 'Any additional feedback?',
      'trainer-rating': 'Rate the trainer',
      'multiple-choice': 'Which topic was most useful?',
    };
    setQuestions(prev => [...prev, {
      id: String(Date.now()),
      type,
      label: defaults[type],
      choices: type === 'multiple-choice' ? ['Option A', 'Option B', 'Option C'] : undefined,
    }]);
  }

  function removeQuestion(id: string) {
    setQuestions(prev => prev.filter(q => q.id !== id));
  }

  async function saveSurvey() {
    if (!surveyName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/academy/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: surveyName.trim(),
          type: surveyType,
          trigger: triggerType,
          questions,
        }),
      });
      const data = await res.json();
      if (res.ok && data.survey) {
        setSurveys(prev => [data.survey, ...prev]);
        setShowCreate(false);
        setSurveyName('');
        setQuestions([
          { id: '1', type: 'nps', label: 'How likely are you to recommend EPR Academy to a colleague? (0–10)' },
          { id: '2', type: 'trainer-rating', label: "How would you rate today's trainer?" },
          { id: '3', type: 'text', label: 'What did you like most about this session?' },
        ]);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Survey Builder</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {loading ? 'Loading…' : `${surveys.length} survey${surveys.length !== 1 ? 's' : ''} · collect structured learner feedback`}
          </p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Create Survey
        </button>
      </div>

      {/* Surveys table */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"/>
          </div>
        ) : surveys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <svg viewBox="0 0 24 24" className="h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <p className="text-sm font-semibold text-slate-400">No surveys created yet</p>
            <p className="text-xs text-slate-600 mt-1">Click "Create Survey" to build your first learner feedback form.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Survey Name</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Program</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Trigger</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Response Rate</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Created</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {surveys.map(s => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 text-slate-200 text-xs font-medium">
                      <Link href={`/academy/feedback/${s.id}/responses`} className="hover:text-indigo-400 transition">{s.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{s.program || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${TYPE_COLORS[s.type] ?? 'bg-slate-700 text-slate-400'}`}>{s.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${TRIGGER_COLORS[s.trigger] ?? 'bg-slate-700 text-slate-400'}`}>{s.trigger}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${s.response_rate ?? 0}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 tabular-nums">{s.response_rate ?? 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/academy/feedback/${s.id}/responses`}
                        className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-[11px] font-medium text-indigo-300 hover:bg-indigo-500/20 transition">
                        Responses
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create survey inline form */}
      {showCreate && (
        <div className="rounded-xl border border-indigo-500/30 bg-[#0c1022] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">New Survey</h2>
            <button onClick={() => setPreviewMode(!previewMode)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${previewMode ? 'bg-violet-600 text-white' : 'border border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
              {previewMode ? 'Edit Mode' : 'Preview Mode'}
            </button>
          </div>

          {!previewMode ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="text-xs text-slate-500 mb-1 block">Survey Name</label>
                  <input value={surveyName} onChange={e => setSurveyName(e.target.value)} placeholder="e.g. Post-Session Survey"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Type</label>
                  <select value={surveyType} onChange={e => setSurveyType(e.target.value as typeof surveyType)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300">
                    <option>Post-Session</option>
                    <option>Post-Program</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Trigger</label>
                  <select value={triggerType} onChange={e => setTriggerType(e.target.value as typeof triggerType)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300">
                    <option>Auto</option>
                    <option>Manual</option>
                  </select>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Questions ({questions.length})</p>
                {questions.map((q, i) => (
                  <div key={q.id} className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-900/50 p-3">
                    <span className="text-xs font-bold text-slate-600 mt-0.5">{i+1}.</span>
                    <div className="flex-1 min-w-0">
                      <input value={q.label} onChange={e => setQuestions(prev => prev.map(x => x.id===q.id ? {...x, label: e.target.value} : x))}
                        className="w-full bg-transparent text-xs text-slate-300 focus:outline-none placeholder:text-slate-600" />
                      <span className={`inline-block mt-1 rounded px-1.5 py-0.5 text-[9px] font-medium ${
                        q.type === 'nps' ? 'bg-indigo-500/10 text-indigo-400' :
                        q.type === 'text' ? 'bg-slate-700 text-slate-400' :
                        q.type === 'trainer-rating' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-violet-500/10 text-violet-400'}`}>{Q_TYPE_LABELS[q.type]}</span>
                    </div>
                    <button onClick={() => removeQuestion(q.id)} className="text-slate-700 hover:text-red-400 transition text-lg leading-none">×</button>
                  </div>
                ))}

                <div className="flex flex-wrap gap-2 pt-1">
                  <p className="text-[10px] text-slate-600 w-full">Add question:</p>
                  {(Object.keys(Q_TYPE_LABELS) as QuestionType[]).map(t => (
                    <button key={t} onClick={() => addQuestion(t)}
                      className="rounded-md border border-slate-700 px-2.5 py-1 text-[10px] text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition">{Q_TYPE_LABELS[t]}</button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={saveSurvey} disabled={saving || !surveyName.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Survey'}
                </button>
                <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 transition">Cancel</button>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-5 max-w-lg">
              <h3 className="text-base font-semibold text-slate-100">{surveyName || 'Untitled Survey'}</h3>
              <p className="text-xs text-slate-500">{surveyType} · {triggerType === 'Auto' ? 'Sent automatically' : 'Manual trigger'}</p>
              {questions.map((q, i) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm text-slate-300">{i+1}. {q.label}</p>
                  {q.type === 'nps' && (
                    <div className="flex gap-1 flex-wrap">
                      {Array.from({length: 11}, (_, n) => (
                        <div key={n} className={`h-7 w-7 rounded text-xs flex items-center justify-center border font-medium ${n <= 6 ? 'border-red-800 text-red-400' : n <= 8 ? 'border-amber-700 text-amber-400' : 'border-emerald-700 text-emerald-400'}`}>{n}</div>
                      ))}
                    </div>
                  )}
                  {q.type === 'trainer-rating' && (
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(s => <div key={s} className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-500">{s}</div>)}
                    </div>
                  )}
                  {q.type === 'text' && <textarea rows={2} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-400 resize-none" placeholder="Type your answer…" readOnly />}
                  {q.type === 'multiple-choice' && q.choices?.map(c => (
                    <label key={c} className="flex items-center gap-2 text-xs text-slate-400"><input type="radio" className="accent-indigo-500" readOnly />{c}</label>
                  ))}
                </div>
              ))}
              <button className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white">Submit Feedback</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
