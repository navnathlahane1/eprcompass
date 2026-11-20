'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { INDIA_STATES_UTS as INDIA_STATES } from '@/lib/indiaGeo';

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

const CATEGORIES = ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Multi-category'];

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function CrmDataPage() {
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [form, setForm]           = useState({ company_name: '', name: '', phone: '', email: '', state: '', category: '' });

  async function load() {
    setLoading(true);
    const sb = getClient();
    const { data } = await sb.from('leads')
      .select('id,company_name,name,phone,email,state,category,status,created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    setLeads(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startEdit(lead: Lead) {
    setEditId(lead.id);
    setForm({
      company_name: lead.company_name,
      name:         lead.name ?? '',
      phone:        lead.phone ?? '',
      email:        lead.email ?? '',
      state:        lead.state ?? '',
      category:     lead.category ?? '',
    });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setSaving(true);
    const sb = getClient();
    await sb.from('leads').update({
      company_name: form.company_name.trim(),
      name:         form.name.trim() || null,
      phone:        form.phone.trim() || null,
      email:        form.email.trim() || null,
      state:        form.state || null,
      category:     form.category || null,
    }).eq('id', editId);
    setSaving(false);
    setEditId(null);
    load();
  }

  const filtered = leads.filter(l =>
    !search || l.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (l.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (l.phone ?? '').includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">CRM Data Entry</h1>
        <p className="text-sm text-slate-500 mt-0.5">View and enrich lead records — fill in missing contact details</p>
      </div>

      <div className="flex gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company, name, phone…"
          className="flex-1 rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500" />
      </div>

      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={saveEdit} className="bg-[#0d1117] border border-slate-700/60 rounded-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-100">Edit Lead Record</h2>
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
                  <label className="text-xs text-slate-400 mb-1 block">State</label>
                  <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                    className="w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500">
                    <option value="">Select state…</option>
                    {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500">
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setEditId(null)}
                className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-400 hover:text-slate-200 transition">Cancel</button>
              <button type="submit" disabled={saving}
                className="flex-1 rounded-lg bg-teal-600 hover:bg-teal-500 py-2 text-sm font-semibold text-white transition disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-slate-500 text-sm">Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/80">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">State</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Completeness</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(l => {
                const filled = [l.name, l.phone, l.email, l.state, l.category].filter(Boolean).length;
                const pct    = Math.round((filled / 5) * 100);
                return (
                  <tr key={l.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-medium text-slate-200">{l.company_name}</td>
                    <td className="px-4 py-3 text-slate-400">
                      <span className={l.name ? 'text-slate-300' : 'text-slate-600 italic'}>{l.name || 'missing'}</span>
                      <br />
                      <span className={`text-xs ${l.phone ? 'text-slate-500' : 'text-rose-500/70'}`}>{l.phone || 'no phone'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{l.state || <span className="text-slate-600 italic">—</span>}</td>
                    <td className="px-4 py-3 text-slate-400">{l.category || <span className="text-slate-600 italic">—</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-700">
                          <div className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => startEdit(l)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-teal-500/20 hover:text-teal-300 text-slate-400 transition">
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">No records match your search.</div>
          )}
        </div>
      )}
    </div>
  );
}
