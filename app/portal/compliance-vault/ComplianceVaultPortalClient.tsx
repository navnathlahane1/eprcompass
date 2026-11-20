'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ACCOUNT_STATUS_COLORS, RENEWAL_WARN_DAYS, RENEWAL_CRITICAL_DAYS } from '@/lib/complianceVault/constants';
import type { AccountStatus } from '@/lib/complianceVault/constants';

type Account = {
  id: string;
  portal_name: string;
  status: string;
  renewal_due_date?: string;
  registration_number?: string;
  client_notes?: string;
  compliance_countries: { id: string; name: string; flag_emoji: string } | null;
  compliance_types: { id: string; name: string; region: string } | null;
  profiles: { full_name: string } | null;
  compliance_credentials: {
    username?: string;
    otp_status?: string;
    has_password?: boolean;
  } | null;
};

export default function ComplianceVaultPortalClient({ accounts }: { accounts: Account[] }) {
  const [filterCountry, setFilterCountry] = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [search, setSearch]               = useState('');

  const countries = useMemo(() => {
    const map = new Map<string, { id: string; name: string; flag_emoji: string }>();
    accounts.forEach(a => { if (a.compliance_countries) map.set(a.compliance_countries.id, a.compliance_countries); });
    return [...map.values()];
  }, [accounts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return accounts.filter(a => {
      if (filterCountry && a.compliance_countries?.id !== filterCountry) return false;
      if (filterStatus  && a.status !== filterStatus) return false;
      if (q && !a.portal_name.toLowerCase().includes(q) &&
          !a.compliance_types?.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [accounts, filterCountry, filterStatus, search]);

  function renewalInfo(dateStr?: string) {
    if (!dateStr) return null;
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
    if (days < 0) return { label: `Expired ${Math.abs(days)} days ago`, cls: 'text-red-600' };
    if (days <= RENEWAL_CRITICAL_DAYS) return { label: `Renewal due in ${days} days`, cls: 'text-red-600 font-semibold' };
    if (days <= RENEWAL_WARN_DAYS)     return { label: `Renewal due in ${days} days`, cls: 'text-amber-600' };
    return { label: `Renews ${new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, cls: 'text-slate-500' };
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search portals…"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 pl-9" />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">All Countries</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">All Statuses</option>
          {['Active','Inactive','Expired','Locked','Pending Setup','Unknown'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-4xl mb-3">🔐</p>
          <p className="text-slate-600 font-medium">No compliance accounts found</p>
          <p className="text-sm text-slate-400 mt-1">
            {accounts.length > 0
              ? 'Try clearing your filters.'
              : 'Your compliance portal credentials will appear here once set up by your manager.'}
          </p>
          {accounts.length === 0 && (
            <a href="/contact"
              className="mt-4 inline-block rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition">
              Contact Your Manager
            </a>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(a => {
            const renewal = renewalInfo(a.renewal_due_date);
            return (
              <div key={a.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{a.compliance_countries?.flag_emoji || '🌐'}</span>
                      <div>
                        <p className="text-xs text-slate-400">{a.compliance_countries?.name || 'Global'}</p>
                        <p className="text-xs font-medium text-teal-700 mt-0.5">{a.compliance_types?.name || 'General'}</p>
                      </div>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${ACCOUNT_STATUS_COLORS[a.status as AccountStatus] || 'bg-slate-100 text-slate-500'}`}>
                      {a.status}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-1">{a.portal_name}</h3>

                  {a.registration_number && (
                    <p className="text-xs text-slate-500">Reg: <span className="font-mono">{a.registration_number}</span></p>
                  )}
                  {renewal && (
                    <p className={`text-xs mt-1.5 ${renewal.cls}`}>{renewal.label}</p>
                  )}
                  {a.compliance_credentials?.username && (
                    <p className="text-xs text-slate-500 mt-1.5">
                      👤 <span className="font-mono">{a.compliance_credentials.username}</span>
                    </p>
                  )}
                  {a.client_notes && (
                    <p className="text-xs text-slate-500 mt-2 border-t border-slate-100 pt-2">{a.client_notes}</p>
                  )}
                </div>
                <div className="px-5 pb-4">
                  <Link href={`/portal/compliance-vault/${a.id}`}
                    className="block w-full text-center rounded-xl bg-teal-50 border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-100 transition">
                    View Details & Credentials →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

