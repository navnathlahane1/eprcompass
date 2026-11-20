'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { ComplianceFramework } from '@/lib/complianceKnowledge/types';

interface Country { id: string; name: string; iso2: string; flag_emoji?: string }
interface ComplianceType { id: string; name: string; code: string; category: string; region: string }
interface Stats {
  total_frameworks: number;
  active_frameworks: number;
  countries: number;
  deadlines_this_month: number;
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl border p-5 ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm opacity-70">{label}</p>
    </div>
  );
}

export default function ComplianceKnowledgeHubPage() {
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [types, setTypes] = useState<ComplianceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCountry) params.set('country_id', filterCountry);
      if (filterType) params.set('compliance_type_id', filterType);

      const [fwRes, countryRes, typeRes] = await Promise.all([
        fetch(`/api/admin/compliance-knowledge/frameworks?${params}`),
        fetch('/api/admin/compliance-knowledge/frameworks?is_active=true').then(() =>
          fetch('/api/epr/financial-years').catch(() => ({ ok: false }))
        ),
        fetch('/api/admin/compliance-knowledge/frameworks'),
      ]);

      const fwData = await fwRes.json();
      setFrameworks(fwData.frameworks || []);

      // Load countries + types from Supabase reference tables via a quick fetch
      const refRes = await fetch('/api/admin/compliance-knowledge/reference');
      if (refRes.ok) {
        const ref = await refRes.json();
        setCountries(ref.countries || []);
        setTypes(ref.types || []);
      }
    } catch {
      setError('Failed to load compliance knowledge data.');
    } finally {
      setLoading(false);
    }
  }, [filterCountry, filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load reference data (countries + types) on mount
  useEffect(() => {
    async function loadRef() {
      try {
        const res = await fetch('/api/admin/compliance-knowledge/reference');
        if (res.ok) {
          const data = await res.json();
          setCountries(data.countries || []);
          setTypes(data.types || []);
        }
      } catch { /* non-critical */ }
    }
    loadRef();
  }, []);

  const filtered = frameworks.filter(fw => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      fw.name.toLowerCase().includes(q) ||
      (fw.short_name || '').toLowerCase().includes(q) ||
      (fw.compliance_countries?.name || '').toLowerCase().includes(q) ||
      (fw.compliance_types?.name || '').toLowerCase().includes(q)
    );
  });

  const stats: Stats = {
    total_frameworks: frameworks.length,
    active_frameworks: frameworks.filter(f => f.is_active).length,
    countries: [...new Set(frameworks.map(f => f.country_id))].length,
    deadlines_this_month: 0,
  };

  const groupedByCountry = filtered.reduce<Record<string, typeof filtered>>((acc, fw) => {
    const key = fw.compliance_countries?.name || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(fw);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Global Compliance Knowledge
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Central configuration for all compliance frameworks, deadlines, and document requirements.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/compliance-knowledge/frameworks"
            className="btn-primary"
          >
            + Add Framework
          </Link>
          <Link
            href="/admin/compliance-knowledge/deadlines"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-950 transition"
          >
            Manage Deadlines
          </Link>
          <Link
            href="/admin/compliance-knowledge/assign"
            className="rounded-lg border border-teal-300 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100 transition"
          >
            Assign to Clients
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Frameworks" value={stats.total_frameworks} color="border-slate-800 bg-slate-900/60 text-slate-100" />
        <StatCard label="Active" value={stats.active_frameworks} color="border-teal-200 bg-teal-50 text-teal-800" />
        <StatCard label="Countries Covered" value={stats.countries} color="border-blue-800/40 bg-blue-950/30 text-blue-300" />
        <StatCard label="Deadlines This Month" value={stats.deadlines_this_month} color="border-orange-800/40 bg-orange-950/30 text-orange-800" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <input
          type="text"
          placeholder="Search frameworks…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />
        <select
          value={filterCountry}
          onChange={e => setFilterCountry(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="">All Countries</option>
          {countries.map(c => (
            <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          {types.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-rose-800/40 bg-rose-950/30 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Framework List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-slate-500">
          Loading compliance frameworks…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-800 p-12 text-center">
          <p className="text-slate-500">No compliance frameworks configured yet.</p>
          <Link
            href="/admin/compliance-knowledge/frameworks"
            className="btn-primary"
          >
            Add First Framework
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByCountry).map(([country, fws]) => (
            <div key={country}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <span>{fws[0]?.compliance_countries?.flag_emoji}</span>
                <span>{country}</span>
                <span className="ml-1 rounded-full bg-slate-900 px-2 py-0.5 text-xs font-normal text-slate-400">
                  {fws.length}
                </span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {fws.map(fw => (
                  <FrameworkCard key={fw.id} framework={fw} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FrameworkCard({ framework: fw }: { framework: ComplianceFramework }) {
  const categoryColor: Record<string, string> = {
    EPR: 'bg-teal-100 text-teal-700',
    Environmental: 'bg-emerald-900/30 text-emerald-300',
    Carbon: 'bg-sky-100 text-sky-700',
    'Import/Export': 'bg-violet-900/30 text-violet-300',
    Regulatory: 'bg-orange-900/30 text-orange-300',
    Other: 'bg-slate-900 text-slate-200',
  };
  const cat = fw.compliance_types?.category || 'Other';

  return (
    <Link
      href={`/admin/compliance-knowledge/frameworks?id=${fw.id}`}
      className="group block rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-teal-300 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-100 group-hover:text-teal-700 transition">
            {fw.short_name || fw.name}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {fw.regulatory_authorities?.acronym || fw.regulatory_authorities?.name || 'No authority set'}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${categoryColor[cat] || categoryColor.Other}`}>
          {cat}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-xs text-slate-500">
        {fw.description || fw.applicability_criteria || 'No description'}
      </p>

      <div className="mt-3 flex items-center gap-2">
        {fw.is_active ? (
          <span className="rounded-full bg-emerald-900/30 px-2 py-0.5 text-[10px] font-medium text-emerald-300">Active</span>
        ) : (
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-500">Inactive</span>
        )}
        {fw.legal_reference && (
          <span className="text-[10px] text-slate-500 truncate">{fw.legal_reference}</span>
        )}
      </div>
    </Link>
  );
}
