'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Ticket {
  id: string;
  lead_id?: string;
  notes?: string;
  status?: string;
  created_at: string;
  leads?: { company_name: string; phone?: string };
}

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function SupportPage() {
  const [tickets, setTickets]   = useState<Ticket[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<'open' | 'closed' | 'all'>('open');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ company_name: '', issue: '', priority: 'Medium' });

  async function load() {
    setLoading(true);
    const sb = getClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await sb.from('tc_followups')
      .select('id,lead_id,notes,status,created_at,leads(company_name,phone)')
      .eq('agent_id', user.id)
      .eq('type', 'support')
      .order('created_at', { ascending: false });
    setTickets((data ?? []) as unknown as Ticket[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = tickets.filter(t => {
    if (tab === 'open')   return t.status !== 'completed' && t.status !== 'closed';
    if (tab === 'closed') return t.status === 'completed' || t.status === 'closed';
    return true;
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.issue.trim()) return;
    setSaving(true);
    const sb = getClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setSaving(false); return; }

    let leadId: string | null = null;
    if (form.company_name.trim()) {
      const { data: ex } = await sb.from('leads')
        .select('id').ilike('company_name', form.company_name.trim()).maybeSingle();
      if (ex) {
        leadId = ex.id;
      } else {
        const { data: nl } = await sb.from('leads')
          .insert({ company_name: form.company_name.trim(), assigned_to: user.id, status: 'new' })
          .select('id').single();
        leadId = nl?.id ?? null;
      }
    }

    await sb.from('tc_followups').insert({
      agent_id: user.id,
      lead_id:  leadId,
      type:     'support',
      notes:    `[${form.priority}] ${form.issue.trim()}`,
      status:   'pending',
    });
    setForm({ company_name: '', issue: '', priority: 'Medium' });
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function close(id: string) {
    const sb = getClient();
    await sb.from('tc_followups').update({ status: 'completed' }).eq('id', id);
    load();
  }

  const TABS = [
    { key: 'open',   label: 'Open' },
    { key: 'closed', label: 'Closed' },
    { key: 'all',    label: 'All' },
  ] as const;

  function parsePriority(notes?: string) {
    const m = notes?.match(/^\[(\w+)\]/);
    return m ? m[1] : 'Medium';
  }

  function priorityColor(p: string) {
    switch (p) {
      case 'Urgent': return 'bg-rose-500/15 text-rose-400';
      case 'High':   return 'bg-amber-500/15 text-amber-400';
      case 'Medium': return 'bg-blue-500/15 text-blue-400';
      default:       return 'bg-slate-700/50 text-slate-400';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Support Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage client support tickets and queries</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="rounded-lg bg-teal-600 hover:bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition">
          + New Ticket
        </button>
      </div>

      <div className="flex gap-1 border-b border-slate-800/80 pb-0">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${tab === t.key ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {t.label}
            {t.key === 'open' && tickets.filter(x => x.status !== 'completed' && x.status !== 'closed').length > 0 && (
              <span className="ml-1.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] px-1.5 py-0.5 font-bold">
                {tickets.filter(x => x.status !== 'completed' && x.status !== 'closed').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={submit} className="bg-[#0d1117] border border-slate-700/60 rounded-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-100">New Support Ticket</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Client / Company</label>
                <input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  placeholder="Company or client name"
                  className="w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Issue / Query *</label>
                <textarea required value={form.issue} onChange={e => setForm(f => ({ ...f, issue: e.target.value }))} rows={4}
                  placeholder="Describe the client's issue in detail…"
                  className="w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500 resize-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500">
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-400 hover:text-slate-200 transition">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex-1 rounded-lg bg-teal-600 hover:bg-teal-500 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
                {saving ? 'Saving…' : 'Create Ticket'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-slate-500 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700/60 p-12 text-center">
          <p className="text-slate-400 text-sm">No tickets in this view. Good work!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => {
            const company = Array.isArray(t.leads) ? t.leads[0]?.company_name : (t.leads as { company_name?: string })?.company_name;
            const priority = parsePriority(t.notes);
            const issueText = t.notes?.replace(/^\[\w+\]\s*/, '') ?? '';
            return (
              <div key={t.id} className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${priorityColor(priority)}`}>{priority}</span>
                    <span className="text-xs text-slate-500">{company || 'No client'}</span>
                    <span className="text-xs text-slate-600">&bull; {new Date(t.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  <p className="text-sm text-slate-300">{issueText}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    t.status === 'completed' || t.status === 'closed' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'
                  }`}>{t.status === 'completed' ? 'Closed' : 'Open'}</span>
                  {t.status !== 'completed' && t.status !== 'closed' && (
                    <button onClick={() => close(t.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
                      Close
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
