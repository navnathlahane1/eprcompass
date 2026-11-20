'use client';

import { useState } from 'react';
import Link from 'next/link';

type AssessType = 'MCQ' | 'Assignment' | 'Rubric' | 'Practical';

interface MCQOption {
  text: string;
}

interface MCQQuestion {
  question: string;
  options: MCQOption[];
  correct: number;
}

interface RubricCriterion {
  name: string;
  maxScore: number;
}

export default function CreateAssessmentPage() {
  const [activeType, setActiveType] = useState<AssessType>('MCQ');
  const [title, setTitle] = useState('');
  const [program, setProgram] = useState('Tier 1');
  const [session, setSession] = useState('');
  const [duration, setDuration] = useState('60');
  const [maxAttempts, setMaxAttempts] = useState('2');
  const [randomise, setRandomise] = useState(false);
  const [passMark, setPassMark] = useState('7');
  const [deadline, setDeadline] = useState('');
  const [assignDesc, setAssignDesc] = useState('');

  // MCQ state
  const [questions, setQuestions] = useState<MCQQuestion[]>([
    { question: '', options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }], correct: 0 },
  ]);

  // Rubric state
  const [criteria, setCriteria] = useState<RubricCriterion[]>([
    { name: 'Content Accuracy', maxScore: 30 },
    { name: 'Practical Application', maxScore: 40 },
    { name: 'Presentation', maxScore: 30 },
  ]);

  const addQuestion = () => {
    setQuestions(prev => [...prev, { question: '', options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }], correct: 0 }]);
  };

  const removeQuestion = (i: number) => {
    setQuestions(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateQuestion = (i: number, field: string, value: string | number) => {
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  };

  const updateOption = (qi: number, oi: number, value: string) => {
    setQuestions(prev => prev.map((q, idx) => {
      if (idx !== qi) return q;
      const opts = [...q.options];
      opts[oi] = { text: value };
      return { ...q, options: opts };
    }));
  };

  const addCriterion = () => setCriteria(prev => [...prev, { name: '', maxScore: 20 }]);
  const removeCriterion = (i: number) => setCriteria(prev => prev.filter((_, idx) => idx !== i));

  const TYPES: { key: AssessType; label: string; icon: string }[] = [
    { key: 'MCQ',        label: 'MCQ Quiz',           icon: '☑' },
    { key: 'Assignment', label: 'Written Assignment',  icon: '📝' },
    { key: 'Rubric',     label: 'Rubric Grading',      icon: '📊' },
    { key: 'Practical',  label: 'Practical Demo',       icon: '🔬' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/academy/assessments" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Assessments
        </Link>
        <span className="text-slate-700">/</span>
        <h1 className="text-xl font-semibold text-slate-100">Create Assessment</h1>
      </div>

      {/* Basic Details */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Basic Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Assessment Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. EPR Module 3 — MCQ Quiz"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Program *</label>
            <select value={program} onChange={e => setProgram(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              <option>Tier 1</option>
              <option>Tier 2</option>
              <option>Tier 3</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Session / Day Association</label>
            <input value={session} onChange={e => setSession(e.target.value)}
              placeholder="e.g. Day 3, Session 2"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
        </div>
      </div>

      {/* Type Selector */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Assessment Type</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setActiveType(t.key)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
                activeType === t.key
                  ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-300'
                  : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300'
              }`}>
              <span className="text-xl">{t.icon}</span>
              <span className="text-xs font-semibold">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MCQ Builder */}
      {activeType === 'MCQ' && (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Questions ({questions.length})</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Pass Mark (out of 10):</label>
                <input value={passMark} onChange={e => setPassMark(e.target.value)} type="number" min="1" max="10"
                  className="w-16 rounded-lg border border-slate-700 bg-slate-800/60 px-2 py-1.5 text-sm text-slate-200 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
          </div>
          <div className="space-y-5">
            {questions.map((q, qi) => (
              <div key={qi} className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">Q{qi + 1}</span>
                  <input value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)}
                    placeholder="Enter question text…"
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  {questions.length > 1 && (
                    <button onClick={() => removeQuestion(qi)} className="shrink-0 text-slate-600 hover:text-rose-400 transition">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 ml-8">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${qi}`} checked={q.correct === oi}
                        onChange={() => updateQuestion(qi, 'correct', oi)}
                        className="accent-emerald-500 shrink-0" />
                      <input value={opt.text} onChange={e => updateOption(qi, oi, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        className={`flex-1 rounded-lg border px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                          q.correct === oi ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-slate-700 bg-slate-800/50'}`} />
                    </div>
                  ))}
                </div>
                <p className="ml-8 text-[10px] text-slate-600">Select the radio button next to the correct answer</p>
              </div>
            ))}
          </div>
          <button onClick={addQuestion}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-700 px-4 py-2.5 text-xs font-medium text-slate-500 hover:border-indigo-500/50 hover:text-indigo-400 transition w-full justify-center">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Question
          </button>
        </div>
      )}

      {/* Assignment Builder */}
      {activeType === 'Assignment' && (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Assignment Details</h2>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Assignment Description / Instructions *</label>
            <textarea value={assignDesc} onChange={e => setAssignDesc(e.target.value)} rows={5}
              placeholder="Describe the assignment, expected deliverables, format requirements, word count, etc."
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Submission Deadline</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-400">Rubric Criteria</label>
              <button onClick={addCriterion} className="text-xs text-indigo-400 hover:text-indigo-300 transition">+ Add Criterion</button>
            </div>
            <div className="space-y-2">
              {criteria.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={c.name} onChange={e => setCriteria(prev => prev.map((cr, idx) => idx === i ? { ...cr, name: e.target.value } : cr))}
                    placeholder="Criterion name"
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  <input type="number" value={c.maxScore} onChange={e => setCriteria(prev => prev.map((cr, idx) => idx === i ? { ...cr, maxScore: parseInt(e.target.value) || 0 } : cr))}
                    className="w-20 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-200 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  <span className="text-[10px] text-slate-600">pts</span>
                  {criteria.length > 1 && (
                    <button onClick={() => removeCriterion(i)} className="text-slate-600 hover:text-rose-400 transition">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              ))}
              <p className="text-[10px] text-slate-600">Total: {criteria.reduce((s, c) => s + c.maxScore, 0)} points</p>
            </div>
          </div>
        </div>
      )}

      {/* Rubric Grading */}
      {activeType === 'Rubric' && (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Rubric Criteria</h2>
          <div className="space-y-2">
            {criteria.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={c.name} onChange={e => setCriteria(prev => prev.map((cr, idx) => idx === i ? { ...cr, name: e.target.value } : cr))}
                  placeholder="Criterion name"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <input type="number" value={c.maxScore} onChange={e => setCriteria(prev => prev.map((cr, idx) => idx === i ? { ...cr, maxScore: parseInt(e.target.value) || 0 } : cr))}
                  className="w-20 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-200 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <span className="text-[10px] text-slate-600">pts</span>
                {criteria.length > 1 && (
                  <button onClick={() => removeCriterion(i)} className="text-slate-600 hover:text-rose-400 transition">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button onClick={addCriterion} className="text-xs text-indigo-400 hover:text-indigo-300 transition">+ Add Criterion</button>
        </div>
      )}

      {/* Practical Demo */}
      {activeType === 'Practical' && (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Practical Demo Configuration</h2>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Demo Instructions / Scenario</label>
            <textarea rows={4} placeholder="Describe the practical scenario, tools required, expected demonstration steps…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Evaluator</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option>EPR Compass Trainer</option>
                <option>Lead Trainer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Mode</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option>Online (Zoom)</option>
                <option>In-Person</option>
                <option>Video Submission</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Settings</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Duration (minutes)</label>
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} min="10"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Max Attempts</label>
            <input type="number" value={maxAttempts} onChange={e => setMaxAttempts(e.target.value)} min="1" max="5"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Pass Mark / 10</label>
            <input type="number" value={passMark} onChange={e => setPassMark(e.target.value)} min="1" max="10"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setRandomise(!randomise)}
            className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition ${randomise ? 'bg-indigo-600' : 'bg-slate-700'}`}>
            <span className={`absolute h-4 w-4 rounded-full bg-white shadow transition-transform ${randomise ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className="text-sm text-slate-300">Randomise Questions</span>
          <span className="text-xs text-slate-600">{randomise ? 'Questions will be shuffled for each attempt' : 'Questions appear in fixed order'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <Link href="/academy/assessments" className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 transition">
          Cancel
        </Link>
        <button className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition">
          Save Draft
        </button>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
          Publish Assessment
        </button>
      </div>
    </div>
  );
}
