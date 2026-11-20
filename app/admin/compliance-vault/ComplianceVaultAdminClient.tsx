'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ACCOUNT_STATUS_COLORS, RENEWAL_WARN_DAYS, RENEWAL_CRITICAL_DAYS } from '@/lib/complianceVault/constants';
import type { AccountStatus } from '@/lib/complianceVault/constants';

// ── Types ─────────────────────────────────────────────────────
type RefType  = { id: string; name: string; code: string; region: string; category: string };
type Country  = { id: string; name: string; iso2: string; flag_emoji: string };
type Manager  = { id: string; full_name: string };
type Client   = { id: string; profiles: { full_name: string; company_name: string } | null };

type Account = {
  id: string;
  portal_name: string;
  portal_url?: string;
  status: string;
  renewal_due_date?: string;
  registration_number?: string;
  client_notes?: string;
  created_at: string;
  clients: { id: string; profiles: { full_name: string; company_name: string } | null } | null;
  compliance_countries: Country | null;
  compliance_types: RefType | null;
  profiles: Manager | null;
  compliance_credentials: {
    id: string; username?: string; otp_email?: string; otp_mobile?: string;
    otp_status?: string; has_password: boolean;
  } | null;
};

// ── Renewal helper ────────────────────────────────────────────
function renewalBadge(dateStr?: string) {
  if (!dateStr) return null;
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: `Expired ${Math.abs(days)}d ago`, cls: 'bg-rose-900/30 text-rose-300' };
  if (days <= RENEWAL_CRITICAL_DAYS) return { label: `Due in ${days}d`, cls: 'bg-rose-900/30 text-rose-300' };
  if (days <= RENEWAL_WARN_DAYS)     return { label: `Due in ${days}d`, cls: 'bg-amber-100 text-amber-700' };
  return { label: new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), cls: 'bg-slate-900 text-slate-500' };
}

// ── Main Component ────────────────────────────────────────────
export default function ComplianceVaultAdminClient({
  accounts: initial, types, countries, managers, clients,
}: {
  accounts: Account[];
  types: RefType[];
  countries: Country[];
  managers: Manager[];
  clients: Client[];
}) {
  const [accounts, setAccounts] = useState(initial);
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterType, setFilterType]       = useState('');
  const [filterManager, setFilterManager] = useState('');
  const [search, setSearch]               = useState('');
  const [showForm, setShowForm]           = useState(false);
  const [editId, setEditId]               = useState<string | null>(null);
  const [deleteId, setDeleteId]           = useState<string | null>(null);
  const [deleting, setDeleting]           = useState(false);
  const [feedback, setFeedback]           = useState('');

  // ── Derived stats ─────────────────────────────────────────
  const stats = useMemo(() => {
    const now = Date.now();
    return {
      total:    accounts.length,
      active:   accounts.filter(a => a.status === 'Active').length,
      expired:  accounts.filter(a => a.status === 'Expired').length,
      noPass:   accounts.filter(a => !a.compliance_credentials?.has_password).length,
      expiring: accounts.filter(a => {
        if (!a.renewal_due_date) return false;
        const d = Math.ceil((new Date(a.renewal_due_date).getTime() - now) / 86400000);
        return d >= 0 && d <= RENEWAL_WARN_DAYS;
      }).length,
    };
  }, [accounts]);

  // ── Filtered list ─────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return accounts.filter(a => {
      if (filterStatus  && a.status !== filterStatus) return false;
      if (filterCountry && a.compliance_countries?.id !== filterCountry) return false;
      if (filterType    && a.compliance_types?.id !== filterType) return false;
      if (filterManager && a.profiles?.id !== filterManager) return false;
      if (q && !a.portal_name.toLowerCase().includes(q) &&
          !a.clients?.profiles?.company_name?.toLowerCase().includes(q) &&
          !a.registration_number?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [accounts, filterStatus, filterCountry, filterType, filterManager, search]);

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/compliance-vault/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) { setFeedback('Delete failed'); return; }
      setAccounts(a => a.filter(x => x.id !== deleteId));
      setDeleteId(null);
      setFeedback('Account deleted');
    } catch { setFeedback('Network error'); }
    finally { setDeleting(false); }
  }, [deleteId]);

  const afterSave = useCallback((saved: Account) => {
    setAccounts(prev => {
      const idx = prev.findIndex(a => a.id === saved.id);
      return idx >= 0 ? prev.map(a => a.id === saved.id ? saved : a) : [saved, ...prev];
    });
    setShowForm(false);
    setEditId(null);
    setFeedback('Saved successfully');
    setTimeout(() => setFeedback(''), 3000);
  }, []);

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Accounts', value: stats.total, cls: 'text-slate-100' },
          { label: 'Active', value: stats.active, cls: 'text-emerald-700' },
          { label: 'Expired', value: stats.expired, cls: 'text-rose-400' },
          { label: 'Expiring (60d)', value: stats.expiring, cls: 'text-amber-600' },
          { label: 'Missing Creds', value: stats.noPass, cls: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="admin-card px-4 py-3">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700">
          {feedback}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search portal, company…"
            className="w-full rounded-lg border border-slate-800 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
        </div>

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">All Statuses</option>
          {['Active','Inactive','Expired','Locked','Pending Setup','Unknown'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">All Countries</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>)}
        </select>

        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">All Types</option>
          {types.map(t => <option key={t.id} value={t.id}>[{t.region}] {t.name}</option>)}
        </select>

        <select value={filterManager} onChange={e => setFilterManager(e.target.value)}
          className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">All Managers</option>
          {managers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
        </select>

        <button onClick={() => { setEditId(null); setShowForm(true); }}
          className="ml-auto btn-primary text-sm px-4 py-2 whitespace-nowrap">
          + Add Account
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="admin-card p-10 text-center">
          <p className="text-sm text-slate-500">No compliance accounts match the current filters.</p>
          <button onClick={() => { setEditId(null); setShowForm(true); }}
            className="mt-3 btn-primary text-sm px-4 py-2">
            Add First Account
          </button>
        </div>
      ) : (
        <div className="admin-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8ecf0] bg-[#f0f4f8]">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Portal / Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden md:table-cell">Country</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden sm:table-cell">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden lg:table-cell">Renewal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden xl:table-cell">Credentials</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hidden xl:table-cell">Manager</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(a => {
                const renewal = renewalBadge(a.renewal_due_date);
                return (
                  <tr key={a.id} className="hover:bg-slate-950 transition group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-semibold text-slate-100 truncate max-w-[180px]">{a.portal_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {a.clients?.profiles?.company_name || a.clients?.profiles?.full_name || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {a.compliance_countries ? (
                        <span className="text-sm">{a.compliance_countries.flag_emoji} {a.compliance_countries.name}</span>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      {a.compliance_types ? (
                        <div>
                          <p className="text-xs font-medium text-slate-200">{a.compliance_types.name}</p>
                          <p className="text-[10px] text-slate-500">{a.compliance_types.region}</p>
                        </div>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ACCOUNT_STATUS_COLORS[a.status as AccountStatus] || 'bg-slate-900 text-slate-500'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {renewal ? (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${renewal.cls}`}>
                          {renewal.label}
                        </span>
                      ) : <span className="text-slate-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      {a.compliance_credentials ? (
                        <div className="text-xs space-y-0.5">
                          {a.compliance_credentials.username && (
                            <p className="text-slate-400">👤 {a.compliance_credentials.username}</p>
                          )}
                          <p className="text-slate-500">
                            {a.compliance_credentials.has_password ? '🔑 Password set' : '⚠️ No password'}
                          </p>
                        </div>
                      ) : <span className="text-amber-500 text-xs">No credentials</span>}
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell text-xs text-slate-500">
                      {a.profiles?.full_name || <span className="text-slate-600">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition">
                        <Link href={`/admin/compliance-vault/${a.id}`}
                          className="text-teal-600 hover:text-teal-700 text-xs font-medium hover:underline">
                          Manage
                        </Link>
                        <button onClick={() => setDeleteId(a.id)}
                          className="text-red-400 hover:text-rose-400 text-xs transition" title="Delete">
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-5 py-2.5 border-t border-slate-800/60 bg-slate-950 text-xs text-slate-500">
            {filtered.length} account{filtered.length !== 1 ? 's' : ''} shown
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <ComplianceVaultForm
          editId={editId}
          types={types}
          countries={countries}
          managers={managers}
          clients={clients}
          onClose={() => { setShowForm(false); setEditId(null); }}
          onSaved={afterSave}
        />
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-slate-900/60 rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-slate-100 mb-2">Delete Compliance Account?</h3>
            <p className="text-sm text-slate-400 mb-5">
              This will permanently delete the account and all stored credentials. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteId(null)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="btn-danger">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Create/Edit Form Modal ────────────────────────────────────
function ComplianceVaultForm({
  editId, types, countries, managers, clients, onClose, onSaved,
}: {
  editId: string | null;
  types: RefType[];
  countries: Country[];
  managers: Manager[];
  clients: Client[];
  onClose: () => void;
  onSaved: (a: Account) => void;
}) {
  const [tab, setTab]     = useState<'account'|'creds'>('account');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [form, setForm] = useState({
    client_id: '', country_id: '', compliance_type_id: '',
    portal_name: '', portal_url: '', status: 'Active',
    renewal_due_date: '', registration_number: '',
    assigned_manager_id: '', internal_notes: '', client_notes: '',
    // credentials
    username: '', password: '',
    recovery_email: '', recovery_phone: '',
    otp_email: '', otp_mobile: '',
    otp_owner_type: 'Client', otp_notes: '', otp_status: 'Active',
    security_notes: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.client_id)   { setError('Client is required'); return; }
    if (!form.portal_name.trim()) { setError('Portal name is required'); return; }
    setLoading(true);
    try {
      const url    = editId ? `/api/admin/compliance-vault/${editId}` : '/api/admin/compliance-vault';
      const method = editId ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Save failed'); return; }
      // Minimal re-fetch would be ideal; for now close and let parent refresh
      onSaved({ id: data.id || editId || '', ...form } as unknown as Account);
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }

  const inputCls = 'w-full rounded-lg border border-slate-800 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent';
  const labelCls = 'block text-xs font-medium text-slate-500 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-slate-900/60 rounded-2xl shadow-xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
          <h2 className="font-bold text-slate-100">{editId ? 'Edit' : 'Add'} Compliance Account</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-400 text-xl">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800/60">
          {(['account','creds'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-medium transition border-b-2 ${
                tab === t ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-200'
              }`}>
              {t === 'account' ? '📋 Account Info' : '🔑 Credentials & OTP'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && (
              <div className="rounded-lg bg-rose-950/30 border border-rose-800/40 px-3 py-2 text-sm text-rose-300">{error}</div>
            )}

            {tab === 'account' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelCls}>Client <span className="text-red-500">*</span></label>
                    <select required value={form.client_id} onChange={set('client_id')} className={inputCls}>
                      <option value="">Select client…</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.profiles?.company_name || c.profiles?.full_name || c.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Country</label>
                    <select value={form.country_id} onChange={set('country_id')} className={inputCls}>
                      <option value="">Select country…</option>
                      {countries.map(c => <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Compliance Type</label>
                    <select value={form.compliance_type_id} onChange={set('compliance_type_id')} className={inputCls}>
                      <option value="">Select type…</option>
                      {types.map(t => <option key={t.id} value={t.id}>[{t.region}] {t.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Portal Name <span className="text-red-500">*</span></label>
                    <input required value={form.portal_name} onChange={set('portal_name')}
                      placeholder="e.g. CPCB EPR Portal" className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Portal URL</label>
                    <input type="url" value={form.portal_url} onChange={set('portal_url')}
                      placeholder="https://cpcb.gov.in/..." className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select value={form.status} onChange={set('status')} className={inputCls}>
                      {['Active','Inactive','Expired','Locked','Pending Setup','Unknown'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Renewal Due Date</label>
                    <input type="date" value={form.renewal_due_date} onChange={set('renewal_due_date')} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Registration Number</label>
                    <input value={form.registration_number} onChange={set('registration_number')}
                      placeholder="Official reg. ID" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Assigned Manager</label>
                    <select value={form.assigned_manager_id} onChange={set('assigned_manager_id')} className={inputCls}>
                      <option value="">Unassigned</option>
                      {managers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Client-Visible Notes</label>
                    <textarea rows={2} value={form.client_notes} onChange={set('client_notes')}
                      placeholder="Visible to client…" className={`${inputCls} resize-none`} />
                  </div>
                  <div>
                    <label className={labelCls}>Internal Notes (Admin Only)</label>
                    <textarea rows={2} value={form.internal_notes} onChange={set('internal_notes')}
                      placeholder="Admin-only notes…" className={`${inputCls} resize-none`} />
                  </div>
                </div>
              </>
            )}

            {tab === 'creds' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Username / Email Login</label>
                  <input value={form.username} onChange={set('username')}
                    placeholder="portal_username" className={inputCls} autoComplete="off" />
                </div>
                <div>
                  <label className={labelCls}>Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')}
                      placeholder="Enter password to encrypt…" className={`${inputCls} pr-10`} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPw(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400 text-xs">
                      {showPw ? '🙈' : '👁'}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Encrypted with AES-256-GCM before storage.</p>
                </div>
                <div>
                  <label className={labelCls}>Recovery Email</label>
                  <input type="email" value={form.recovery_email} onChange={set('recovery_email')}
                    placeholder="recovery@email.com" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Recovery Phone</label>
                  <input value={form.recovery_phone} onChange={set('recovery_phone')}
                    placeholder="Enter phone number" className={inputCls} />
                </div>
                <hr className="col-span-2 border-slate-800/60" />
                <div>
                  <label className={labelCls}>OTP Email</label>
                  <input type="email" value={form.otp_email} onChange={set('otp_email')}
                    placeholder="otp@email.com" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>OTP Mobile</label>
                  <input value={form.otp_mobile} onChange={set('otp_mobile')}
                    placeholder="Enter phone number" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>OTP Owner / Controller</label>
                  <select value={form.otp_owner_type} onChange={set('otp_owner_type')} className={inputCls}>
                    {['Client','Consultant','Director','Admin','Shared','Other'].map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>OTP Status</label>
                  <select value={form.otp_status} onChange={set('otp_status')} className={inputCls}>
                    {['Active','Inaccessible','Changed','Requires Update','Unknown'].map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>OTP Notes</label>
                  <input value={form.otp_notes} onChange={set('otp_notes')}
                    placeholder="e.g. 'OTP comes to client director&#39;s phone'" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Security Notes</label>
                  <input value={form.security_notes} onChange={set('security_notes')}
                    placeholder='e.g. "Uses Google Authenticator, CAPTCHA on login"' className={inputCls} />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-800/60 bg-slate-950">
            <button type="submit" disabled={loading} className="btn-primary text-sm px-5 py-2.5">
              {loading ? 'Saving…' : editId ? 'Update Account' : 'Create Account'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary text-sm px-5 py-2.5">
              Cancel
            </button>
            {tab === 'account' && (
              <button type="button" onClick={() => setTab('creds')}
                className="ml-auto text-sm text-teal-600 hover:text-teal-700 font-medium">
                Next: Credentials →
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
