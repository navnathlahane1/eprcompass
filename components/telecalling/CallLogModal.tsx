'use client';

import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';

interface CallLogModalProps {
  leadId: string;
  leadName: string;
  onClose: () => void;
  onSaved: () => void;
}

const DISPOSITIONS = ['Interested', 'Not Interested', 'Call Back', 'Wrong Number', 'No Answer', 'Busy', 'Voicemail', 'Other'];

// Feature 2: Structured call outcomes
const OUTCOMES = [
  { key: 'outcome_quote_sent', label: '📋 Quote Sent' },
  { key: 'outcome_demo_scheduled', label: '📅 Demo Scheduled' },
  { key: 'outcome_dm_identified', label: '👤 DM Identified' },
  { key: 'outcome_gatekeeper', label: '🚧 Gatekeeper' },
  { key: 'outcome_escalate', label: '⬆️ Escalate to Senior' },
];

export default function CallLogModal({ leadId, leadName, onClose, onSaved }: CallLogModalProps) {
  const [form, setForm] = useState({
    duration_seconds: '',
    disposition: 'Call Back',
    notes: '',
    status: 'Completed',
    schedule_followup: false,
    followup_date: '',
    followup_notes: '',
    outcome_quote_sent: false,
    outcome_demo_scheduled: false,
    outcome_dm_identified: false,
    outcome_gatekeeper: false,
    outcome_escalate: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const callRes = await fetch('/api/admin/telecalling/calls', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          duration_seconds: parseInt(form.duration_seconds) || 0,
          disposition: form.disposition,
          notes: form.notes,
          status: form.status,
          direction: 'Outbound',
          outcome_quote_sent: form.outcome_quote_sent,
          outcome_demo_scheduled: form.outcome_demo_scheduled,
          outcome_dm_identified: form.outcome_dm_identified,
          outcome_gatekeeper: form.outcome_gatekeeper,
          outcome_escalate: form.outcome_escalate,
        }),
      });
      if (!callRes.ok) throw new Error((await callRes.json()).error || 'Failed to log call');
      const { call } = await callRes.json();
      trackEvent('Call Logged', {
        disposition: form.disposition,
        outcome_quote_sent: form.outcome_quote_sent,
        outcome_demo_scheduled: form.outcome_demo_scheduled,
        followup_scheduled: form.schedule_followup,
      });

      if (form.schedule_followup && form.followup_date) {
        await fetch('/api/admin/telecalling/followups', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            lead_id: leadId,
            call_id: call.id,
            scheduled_for: form.followup_date,
            notes: form.followup_notes,
            type: 'Call',
          }),
        });
      }

      onSaved();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-slate-900/60 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-100">Log Call — {leadName}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
              >
                <option>Completed</option>
                <option>No Answer</option>
                <option>Busy</option>
                <option>Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Duration (seconds)</label>
              <input
                type="number"
                min="0"
                value={form.duration_seconds}
                onChange={e => setForm(f => ({ ...f, duration_seconds: e.target.value }))}
                className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Disposition</label>
            <select
              value={form.disposition}
              onChange={e => setForm(f => ({ ...f, disposition: e.target.value }))}
              className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
            >
              {DISPOSITIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
              placeholder="Call notes…"
            />
          </div>

          {/* Feature 2: Structured outcomes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Outcomes (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {OUTCOMES.map(o => (
                <label key={o.key} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form as any)[o.key]}
                    onChange={e => setForm(f => ({ ...f, [o.key]: e.target.checked }))}
                    className="rounded border-slate-600 bg-slate-800"
                  />
                  <span className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${(form as any)[o.key] ? 'bg-teal-500/20 border-teal-500/40 text-teal-200' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                    {o.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.schedule_followup}
              onChange={e => setForm(f => ({ ...f, schedule_followup: e.target.checked }))}
              className="rounded"
            />
            Schedule follow-up
          </label>

          {form.schedule_followup && (
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Follow-up date/time</label>
                <input
                  type="datetime-local"
                  value={form.followup_date}
                  onChange={e => setForm(f => ({ ...f, followup_date: e.target.value }))}
                  className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
                <input
                  type="text"
                  value={form.followup_notes}
                  onChange={e => setForm(f => ({ ...f, followup_notes: e.target.value }))}
                  className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
                  placeholder="Optional"
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-700 text-slate-300 rounded-lg py-2 text-sm font-medium hover:bg-slate-800/40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-teal-500/15 border border-teal-500/30 text-teal-200 rounded-lg py-2 text-sm font-medium hover:bg-teal-500/25 disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save Call'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
