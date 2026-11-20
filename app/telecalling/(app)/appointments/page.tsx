'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { trackEvent } from '@/lib/analytics';

interface Appointment {
  id: string;
  lead_id?: string;
  notes?: string;
  follow_up_date?: string;
  follow_up_time?: string;
  status?: string;
  created_at: string;
  leads?: { company_name: string; name?: string; phone?: string };
}

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<'upcoming' | 'done' | 'all'>('upcoming');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ company_name: '', date: '', time: '', notes: '' });

  async function load() {
    setLoading(true);
    const sb = getClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await sb.from('tc_followups')
      .select('id,lead_id,notes,follow_up_date,follow_up_time,status,created_at,leads(company_name,name,phone)')
      .eq('agent_id', user.id)
      .eq('type', 'appointment')
      .order('follow_up_date', { ascending: true });
    setAppointments((data ?? []) as unknown as Appointment[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().split('T')[0];
  const filtered = appointments.filter(a => {
    if (tab === 'upcoming') return (a.follow_up_date ?? '') >= today && a.status !== 'completed';
    if (tab === 'done') return a.status === 'completed';
    return true;
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return;
    setSaving(true);
    const sb = getClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setSaving(false); return; }

    let leadId: string | null = null;
    if (form.company_name.trim()) {
      const { data: existing } = await sb.from('leads')
        .select('id').ilike('company_name', form.company_name.trim()).maybeSingle();
      if (existing) {
        leadId = existing.id;
      } else {
        const { data: newLead } = await sb.from('leads')
          .insert({ company_name: form.company_name.trim(), assigned_to: user.id, status: 'new' })
          .select('id').single();
        leadId = newLead?.id ?? null;
      }
    }

    await sb.from('tc_followups').insert({
      agent_id:        user.id,
      lead_id:         leadId,
      type:            'appointment',
      follow_up_date:  form.date,
      follow_up_time:  form.time || null,
      notes:           form.notes.trim() || null,
      status:          'pending',
    });
    trackEvent('Telecalling Appointment Booked', {});
    setForm({ company_name: '', date: '', time: '', notes: '' });
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function markDone(id: string) {
    const sb = getClient();
    await sb.from('tc_followups').update({ status: 'completed' }).eq('id', id);
    trackEvent('Telecalling Appointment Completed', {});
    load();
  }

  const TABS = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'done',     label: 'Done' },
    { key: 'all',      label: 'All' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Appointments</h1>
          <p className="text-sm text-slate-500 mt-0.5">Schedule and manage client appointments</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="rounded-lg bg-teal-600 hover:bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition">
          + New Appointment
        </button>
      </div>

      <div className="flex gap-1 border-b border-slate-800/80 pb-0">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${tab === t.key ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={submit} className="bg-[#0d1117] border border-slate-700/60 rounded-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-100">New Appointment</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Company Name</label>
                <input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  placeholder="Existing or new company"
                  className="w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Date *</label>
                  <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Time</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                  placeholder="Meeting agenda, contact details, etc."
                  className="w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-400 hover:text-slate-200 transition">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex-1 rounded-lg bg-teal-600 hover:bg-teal-500 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
                {saving ? 'Saving…' : 'Schedule'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-slate-500 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700/60 p-12 text-center">
          <p className="text-slate-400 text-sm">No appointments in this view.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const company = Array.isArray(a.leads) ? a.leads[0]?.company_name : (a.leads as { company_name?: string })?.company_name;
            return (
              <div key={a.id} className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-200">{company || 'No company'}</p>
                  <p className="text-xs text-slate-500">
                    {a.follow_up_date} {a.follow_up_time ? `at ${a.follow_up_time}` : ''}
                  </p>
                  {a.notes && <p className="text-sm text-slate-400">{a.notes}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    a.status === 'completed' ? 'bg-green-500/15 text-green-400' : 'bg-teal-500/15 text-teal-400'
                  }`}>{a.status || 'pending'}</span>
                  {a.status !== 'completed' && (
                    <button onClick={() => markDone(a.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
                      Mark Done
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
