'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, MapPin, Calendar, Tag, Plus, Clock } from 'lucide-react';

const WASTE_CATEGORIES = ['All', 'Plastic', 'E-Waste', 'Battery', 'Tyre', 'Other'];
const REQ_TYPES = [
  'All',
  'EPR Credits',
  'Recycling Service',
  'PRO Partnership',
  'EPR Consultancy',
  'Collection Partner',
  'Technology Provider',
  'Other',
];

function statusBadge(status: string) {
  if (status === 'Open') return 'bg-emerald-100 text-emerald-800';
  if (status === 'In Discussion') return 'bg-blue-100 text-blue-800';
  if (status === 'Fulfilled') return 'bg-slate-100 text-slate-700';
  return 'bg-gray-100 text-gray-600';
}

function reqTypeBadge(type: string) {
  const map: Record<string, string> = {
    'EPR Credits': 'bg-purple-100 text-purple-800',
    'Recycling Service': 'bg-teal-100 text-teal-800',
    'PRO Partnership': 'bg-blue-100 text-blue-800',
    'EPR Consultancy': 'bg-amber-100 text-amber-800',
    'Collection Partner': 'bg-indigo-100 text-indigo-800',
    'Technology Provider': 'bg-rose-100 text-rose-800',
  };
  return map[type] || 'bg-gray-100 text-gray-700';
}

export default function RequirementsClient({
  role,
  userId,
  initialRequirements,
  myPostedIds,
}: {
  role: string;
  userId: string;
  initialRequirements: any[];
  myPostedIds: string[];
}) {
  const [requirements] = useState(initialRequirements);
  const [filters, setFilters] = useState({
    waste_category: 'All',
    requirement_type: 'All',
    status: 'Open',
    location: '',
  });

  const mySet = useMemo(() => new Set(myPostedIds), [myPostedIds]);

  const filtered = useMemo(() => {
    return requirements.filter((r) => {
      const catOk = filters.waste_category === 'All' || r.waste_category === filters.waste_category;
      const typeOk = filters.requirement_type === 'All' || r.requirement_type === filters.requirement_type;
      const statusOk = filters.status === 'All' || r.status === filters.status;
      const locOk =
        !filters.location ||
        (r.location_state || '').toLowerCase().includes(filters.location.toLowerCase()) ||
        (r.location_city || '').toLowerCase().includes(filters.location.toLowerCase());
      return catOk && typeOk && statusOk && locOk;
    });
  }, [requirements, filters]);

  const kpis = useMemo(() => {
    const open = requirements.filter((r) => r.status === 'Open').length;
    const cats = new Set(requirements.map((r) => r.waste_category)).size;
    const mine = mySet.size;
    return { total: requirements.length, open, cats, mine };
  }, [requirements, mySet]);

  return (
    <main className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Requirements Board</h1>
            <p className="mt-1 text-sm text-gray-600">
              Browse EPR-related requirements posted by companies. Contact details are not shown — express interest through the platform.
            </p>
          </div>
          <Link
            href="/marketplace/requirements/new"
            className="inline-flex items-center gap-2 rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
          >
            <Plus size={15} /> Post a Requirement
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <article className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Total Requirements</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{kpis.total}</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Open Now</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">{kpis.open}</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">Waste Categories</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{kpis.cats}</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">My Posted</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{kpis.mine}</p>
        </article>
      </section>

      {/* Filters */}
      <section className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <select
          value={filters.waste_category}
          onChange={(e) => setFilters((p) => ({ ...p, waste_category: e.target.value }))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {WASTE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              Category: {c}
            </option>
          ))}
        </select>
        <select
          value={filters.requirement_type}
          onChange={(e) => setFilters((p) => ({ ...p, requirement_type: e.target.value }))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {REQ_TYPES.map((t) => (
            <option key={t} value={t}>
              Type: {t}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {['All', 'Open', 'In Discussion', 'Fulfilled', 'Closed'].map((s) => (
            <option key={s} value={s}>
              Status: {s}
            </option>
          ))}
        </select>
        <input
          value={filters.location}
          onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
          placeholder="Filter by state / city"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </section>

      {/* Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((r) => {
          const isOwner = mySet.has(r.id);
          const deadlineStr = r.requirement_deadline
            ? new Date(r.requirement_deadline).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : null;
          const postedStr = new Date(r.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          return (
            <article
              key={r.id}
              className={`rounded-xl border bg-white p-4 ${isOwner ? 'border-green-300' : 'border-gray-200'}`}
            >
              {/* Top badges */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${reqTypeBadge(r.requirement_type)}`}
                >
                  {r.requirement_type}
                </span>
                <div className="flex items-center gap-1.5">
                  {isOwner && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                      My Post
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusBadge(r.status)}`}>
                    {r.status}
                  </span>
                </div>
              </div>

              {/* Waste category + company type */}
              <div className="mt-3 flex items-center gap-2">
                <Tag size={13} className="text-gray-400 shrink-0" />
                <p className="text-sm font-semibold text-gray-900">
                  {r.waste_category} — {r.company_type}
                </p>
              </div>

              {/* Description */}
              <p className="mt-2 line-clamp-3 text-sm text-gray-700">{r.description}</p>

              {/* Details grid */}
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-600">
                {r.quantity_label || r.quantity_kg ? (
                  <>
                    <dt className="font-medium text-gray-500">Quantity</dt>
                    <dd>{r.quantity_label || `${Number(r.quantity_kg).toLocaleString('en-IN')} KG`}</dd>
                  </>
                ) : null}
                {r.location_state || r.location_city ? (
                  <>
                    <dt className="font-medium text-gray-500 flex items-center gap-1">
                      <MapPin size={11} /> Location
                    </dt>
                    <dd>
                      {[r.location_city, r.location_state].filter(Boolean).join(', ')}
                    </dd>
                  </>
                ) : null}
                {r.budget_range ? (
                  <>
                    <dt className="font-medium text-gray-500">Budget</dt>
                    <dd>{r.budget_range}</dd>
                  </>
                ) : null}
                {r.engagement_type ? (
                  <>
                    <dt className="font-medium text-gray-500">Engagement</dt>
                    <dd>{r.engagement_type}</dd>
                  </>
                ) : null}
              </dl>

              {/* Footer */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={11} /> Posted {postedStr}
                </span>
                {deadlineStr && (
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> Needed by {deadlineStr}
                  </span>
                )}
              </div>

              {/* Express Interest — only non-owners */}
              {!isOwner && r.status === 'Open' && (
                <button
                  disabled
                  title="Interest tracking coming soon"
                  className="mt-3 w-full rounded-md border border-green-700 px-3 py-2 text-sm font-semibold text-green-700 opacity-60 cursor-not-allowed"
                >
                  Express Interest (coming soon)
                </button>
              )}
            </article>
          );
        })}
      </section>

      {filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          No requirements match the current filters.
        </p>
      )}
    </main>
  );
}
