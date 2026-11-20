'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Lead {
  id: string;
  company_name: string;
  name?: string;
  phone?: string;
  email?: string;
  state?: string;
  category?: string;
  status?: string;
  created_at: string;
}

const SOURCES = ['Web Form', 'LinkedIn', 'Referral', 'Cold Outreach', 'Event', 'Directory', 'Other'];
const CATEGORIES = ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Multi-category', 'Unknown'];

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function LeadGenPage() {
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ company_name: '', name: '', phone: '', email: '', state: '', category: '', source: '' });

  async function load() {
    setLoading(true);
    const sb = getClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await sb.from('leads')
      .select('id,company_name,name,phone,email,state,category,status,created_at')
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    setLeads(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company_name.trim()) return;
    setSaving(true);
    const sb = getClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setSaving(false); return; }
    await sb.from('leads').insert({
      company_name: form.company_name.trim(),
      name:         form.name.trim() || null,
      phone:        form.phone.trim() || null,
      email:        form.email.trim() || null,
      state:        form.state || null,
      category:     form.category || null,
      lead_source:  form.source || null,
      assigned_to:  user.id,
      status:       'new',
    });
    setForm({ company_name: '', name: '', phone: '', email: '', state: '', category: '', source: '' });
    setShowForm(false);
    setSaving(false);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Lead Pipeline</h1>
          <p className="text-sm text-slate-500 mt-0.5">Capture and track new leads from all sources</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="rounded-lg bg-teal-600 hover:bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition">
          + Add Lead
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={submit} className="bg-[#0d1117] border border-slate-700/60 rounded-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-100">Capture New Lead</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Company Name *</label>
                <input required value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  className="w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Contact Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500">
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Source</label>
                  <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500">
                    <option value="">Select…</option>
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-400 hover:text-slate-200 transition">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex-1 rounded-lg bg-teal-600 hover:bg-teal-500 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
                {saving ? 'Saving…' : 'Add Lead'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-slate-500 text-sm">Loading…</div>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700/60 p-12 text-center">
          <p className="text-slate-400 text-sm">No leads yet. Add your first lead to start building the pipeline.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/80">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {leads.map(l => (
                <tr key={l.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3 font-medium text-slate-200">{l.company_name}</td>
                  <td className="px-4 py-3 text-slate-400">{l.name || '—'}<br /><span className="text-xs text-slate-600">{l.phone || ''}</span></td>
                  <td className="px-4 py-3 text-slate-400">{l.category || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-teal-500/15 text-teal-400 capitalize">{l.status || 'new'}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(l.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
