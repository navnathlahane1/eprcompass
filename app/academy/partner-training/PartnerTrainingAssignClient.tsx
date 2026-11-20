'use client';

import { useEffect, useState } from 'react';

const PARTNER_TYPES = [
  'Env Consultant','EHS Consultant','ISO Consultant','ESG Consultant',
  'CA/CS','Legal/Law','Trade Association','PRO','Waste Management','CHA',
  'Logistics','Packaging Consultant','Recycler Network','CSR/NGO',
  'Academic','Freelance Trainer','Tech/Digital','Other',
];

const TARGET_OPTIONS = [
  { value: 'all_partners',     label: 'All Partners',       desc: 'Every partner in the portal' },
  { value: 'partner_type',     label: 'By Partner Type',    desc: 'e.g. Env Consultant, CA/CS' },
  { value: 'partner_tier',     label: 'By Partner Tier',    desc: 'Tier 1 – 5 (strategy tiers)' },
  { value: 'specific_partner', label: 'Specific Partner',   desc: 'Choose a single partner by ID' },
] as const;
type TargetType = typeof TARGET_OPTIONS[number]['value'];

interface Program {
  id: string;
  title: string;
  delivery_mode: string;
  status: string;
  content_url: string | null;
  start_date: string | null;
  duration_hours: number | null;
}

interface Assignment {
  id: string;
  program_id: string;
  target_type: TargetType;
  partner_type: string | null;
  partner_tier: number | null;
  partner_id: string | null;
  assigned_at: string;
  academy_programs: { title: string; delivery_mode: string } | null;
}

const MODE_BADGE: Record<string, string> = {
  'Online Live':  'bg-blue-500/20 text-blue-300',
  'Recorded':     'bg-violet-500/20 text-violet-300',
  'Self-Paced':   'bg-emerald-500/20 text-emerald-300',
  'Hybrid':       'bg-amber-500/20 text-amber-300',
  'Classroom':    'bg-slate-500/20 text-slate-400',
};

const BLANK_FORM = {
  program_id: '', target_type: 'all_partners' as TargetType,
  partner_type: '', partner_tier: '', specific_partner_id: '', content_url: '',
};

export default function PartnerTrainingAssignClient() {
  const [programs, setPrograms]     = useState<Program[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState({ ...BLANK_FORM });

  async function load() {
    setLoading(true);
    const res = await fetch('/api/academy/partner-training');
    const json = await res.json();
    setPrograms(json.programs || []);
    setAssignments(json.assignments || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const selectedProgram = programs.find(p => p.id === form.program_id);
  const isRecorded = selectedProgram &&
    ['Recorded', 'Self-Paced'].includes(selectedProgram.delivery_mode);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.program_id) { setError('Select a program.'); return; }
    setSaving(true); setError(''); setSuccess('');

    const payload: Record<string, unknown> = {
      program_id:   form.program_id,
      target_type:  form.target_type,
      content_url:  form.content_url.trim() || null,
    };
    if (form.target_type === 'partner_type')     payload.partner_type  = form.partner_type;
    if (form.target_type === 'partner_tier')     payload.partner_tier  = Number(form.partner_tier);
    if (form.target_type === 'specific_partner') payload.partner_id    = form.specific_partner_id.trim();

    const res = await fetch('/api/academy/partner-training', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error || 'Failed'); return; }
    setSuccess('Training assigned successfully.');
    setShowForm(false);
    setForm({ ...BLANK_FORM });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this assignment? Partners will lose access to this training.')) return;
    await fetch(`/api/academy/partner-training/${id}`, { method: 'DELETE' });
    load();
  }

  function targetLabel(a: Assignment) {
    if (a.target_type === 'all_partners')    return 'All Partners';
    if (a.target_type === 'partner_type')    return `Type: ${a.partner_type}`;
    if (a.target_type === 'partner_tier')    return `Tier ${a.partner_tier}`;
    if (a.target_type === 'specific_partner') return `Partner ID: ${a.partner_id?.slice(0,8)}…`;
    return '—';
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Partner Training Assignments</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Assign academy programs to partners — all, by type, by tier, or individually.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(''); setSuccess(''); }}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Assign Training
        </button>
      </div>

      {/* Feedback */}
      {error   && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">{error}</p>}
      {success && <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">{success}</p>}

      {/* Assignment form */}
      {showForm && (
        <div className="rounded-xl border border-indigo-500/30 bg-[#0c1022] p-5 space-y-5">
          <p className="text-sm font-semibold text-indigo-300">New Training Assignment</p>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Program picker */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Program <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={form.program_id}
                onChange={e => setForm(f => ({ ...f, program_id: e.target.value, content_url: '' }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">— Select a program —</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} [{p.delivery_mode}]
                  </option>
                ))}
              </select>
              {selectedProgram && (
                <p className="text-xs text-slate-500">
                  Mode: <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${MODE_BADGE[selectedProgram.delivery_mode] || 'text-slate-400'}`}>
                    {selectedProgram.delivery_mode}
                  </span>
                  {selectedProgram.duration_hours ? ` · ${selectedProgram.duration_hours}h` : ''}
                  {selectedProgram.start_date ? ` · Starts ${new Date(selectedProgram.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                </p>
              )}
            </div>

            {/* Content URL (for recorded) */}
            {isRecorded && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Video / Content URL
                  <span className="ml-1 font-normal text-slate-600">(YouTube, Vimeo, Drive, etc.)</span>
                </label>
                <input
                  type="url"
                  value={form.content_url}
                  onChange={e => setForm(f => ({ ...f, content_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=…"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {selectedProgram?.content_url && !form.content_url && (
                  <p className="text-xs text-slate-500">
                    Current: <span className="text-indigo-400">{selectedProgram.content_url}</span>
                  </p>
                )}
              </div>
            )}

            {/* Target type */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Assign To <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TARGET_OPTIONS.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, target_type: t.value }))}
                    className={`flex flex-col gap-1 rounded-lg border p-3 text-left transition ${
                      form.target_type === t.value
                        ? 'border-indigo-500/60 bg-indigo-500/15 ring-1 ring-indigo-500/20'
                        : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                    }`}
                  >
                    <span className={`text-xs font-semibold ${form.target_type === t.value ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {t.label}
                    </span>
                    <span className="text-[10px] text-slate-600 leading-tight">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional fields */}
            {form.target_type === 'partner_type' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Partner Type <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={form.partner_type}
                  onChange={e => setForm(f => ({ ...f, partner_type: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">— Select type —</option>
                  {PARTNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}

            {form.target_type === 'partner_tier' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Partner Tier <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={form.partner_tier}
                  onChange={e => setForm(f => ({ ...f, partner_tier: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">— Select tier —</option>
                  <option value="1">Tier 1 — Direct Sales Power</option>
                  <option value="2">Tier 2 — Trusted Advisors</option>
                  <option value="3">Tier 3 — Networked Influencers</option>
                  <option value="4">Tier 4 — Regional Specialists</option>
                  <option value="5">Tier 5 — Emerging / Digital</option>
                </select>
              </div>
            )}

            {form.target_type === 'specific_partner' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Partner ID <span className="text-rose-400">*</span>
                  <span className="ml-1 font-normal text-slate-600">(UUID from Partners → detail page)</span>
                </label>
                <input
                  required
                  value={form.specific_partner_id}
                  onChange={e => setForm(f => ({ ...f, specific_partner_id: e.target.value }))}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white transition"
              >
                {saving ? 'Assigning…' : 'Assign Training'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assignments list */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading…</div>
      ) : assignments.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#0c1022] py-16 text-center">
          <p className="text-sm text-slate-500">No assignments yet. Click "Assign Training" to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Program</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">Assigned On</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id} className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-200">
                    {a.academy_programs?.title || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${MODE_BADGE[a.academy_programs?.delivery_mode || ''] || 'bg-slate-700/40 text-slate-400'}`}>
                      {a.academy_programs?.delivery_mode || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{targetLabel(a)}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(a.assigned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="rounded border border-slate-800 px-2.5 py-1 text-xs text-rose-500 hover:border-rose-500/40 hover:bg-rose-500/10 transition"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
