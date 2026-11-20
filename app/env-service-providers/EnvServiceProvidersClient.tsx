'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Provider {
  id: string;
  name: string;
  tagline: string | null;
  specialty: string | null;
  about: string | null;
  years_experience: number | null;
  skills: string[];
  photo_url: string | null;
  profile_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  source_platform: string | null;
  linkedin_url: string | null;
  featured: boolean;
  verified: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

function locationLabel(p: Provider) {
  return [p.city, p.state].filter(Boolean).join(', ') || p.country || '';
}

const SPECIALTY_COLORS: Record<string, string> = {
  'Legal Regulation and Compliance': 'bg-blue-100 text-blue-800',
  'Waste Management':                'bg-emerald-100 text-emerald-800',
  'Environmental Consulting':        'bg-teal-100 text-teal-800',
  'ESG & Sustainability':            'bg-violet-100 text-violet-800',
  'default':                         'bg-slate-100 text-slate-700',
};

function specialtyBadge(specialty: string | null) {
  if (!specialty) return SPECIALTY_COLORS.default;
  const key = Object.keys(SPECIALTY_COLORS).find((k) => specialty.toLowerCase().includes(k.toLowerCase()));
  return key ? SPECIALTY_COLORS[key] : SPECIALTY_COLORS.default;
}

// ── Card ──────────────────────────────────────────────────────────────────────
function ProviderCard({ p, onSelect }: { p: Provider; onSelect: (p: Provider) => void }) {
  const loc = locationLabel(p);

  return (
    <article
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      onClick={() => onSelect(p)}
    >
      {/* Header */}
      <div className="flex items-start gap-4 p-5">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-emerald-100">
          {p.photo_url ? (
            <Image
              src={p.photo_url}
              alt={p.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-emerald-700">
              {initials(p.name)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-slate-900 truncate">{p.name}</h2>
            {p.verified && (
              <span title="Verified" className="text-blue-500 text-sm">✔</span>
            )}
            {p.featured && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Featured</span>
            )}
          </div>
          {p.tagline && (
            <p className="mt-0.5 text-sm text-slate-500 line-clamp-2">{p.tagline}</p>
          )}
        </div>
      </div>

      {/* Specialty + location */}
      <div className="px-5 pb-3 flex flex-wrap gap-2 items-center">
        {p.specialty && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${specialtyBadge(p.specialty)}`}>
            {p.specialty.replace(' Consultant', '')}
          </span>
        )}
        {loc && (
          <span className="text-xs text-slate-400">📍 {loc}</span>
        )}
        {p.years_experience != null && (
          <span className="text-xs text-slate-400">🕐 {p.years_experience} yrs exp</span>
        )}
      </div>

      {/* About snippet */}
      {p.about && (
        <p className="px-5 pb-3 text-sm text-slate-600 line-clamp-3">{p.about}</p>
      )}

      {/* Skills */}
      {p.skills?.length > 0 && (
        <div className="px-5 pb-4 flex flex-wrap gap-1.5">
          {p.skills.slice(0, 5).map((s) => (
            <span key={s} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
              {s}
            </span>
          ))}
          {p.skills.length > 5 && (
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-400">
              +{p.skills.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto border-t border-slate-100 px-5 py-3 flex items-center justify-between">
        <span className="text-xs text-slate-400 capitalize">via {p.source_platform || 'directory'}</span>
        {p.profile_url && (
          <a
            href={p.profile_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-800"
          >
            View Profile →
          </a>
        )}
      </div>
    </article>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function DrawerOverlay({ p, onClose }: { p: Provider; onClose: () => void }) {
  const loc = locationLabel(p);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="relative h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Hero */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-6 pt-10 pb-6">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-emerald-200">
              {p.photo_url ? (
                <Image src={p.photo_url} alt={p.name} fill className="object-cover" unoptimized />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-emerald-700">
                  {initials(p.name)}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{p.name}</h2>
              {p.specialty && (
                <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${specialtyBadge(p.specialty)}`}>
                  {p.specialty}
                </span>
              )}
              {loc && <p className="mt-1 text-sm text-slate-500">📍 {loc}</p>}
            </div>
          </div>

          {p.tagline && (
            <p className="mt-4 text-sm text-slate-600 italic">"{p.tagline}"</p>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
            {p.years_experience != null && (
              <span>🕐 <strong>{p.years_experience}</strong> years experience</span>
            )}
            {p.skills?.length > 0 && (
              <span>🛠 <strong>{p.skills.length}</strong> skills</span>
            )}
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* About */}
          {p.about && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">About</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{p.about}</p>
            </section>
          )}

          {/* Skills */}
          {p.skills?.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-2">Skills & Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {p.skills.map((s) => (
                  <span key={s} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm text-slate-700">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {p.profile_url && (
              <a
                href={p.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-700"
              >
                View Full Profile
              </a>
            )}
            {p.linkedin_url && (
              <a
                href={(p as any).linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────
export default function EnvServiceProvidersClient({ initialRows }: { initialRows: Provider[] }) {
  const [search, setSearch]     = useState('');
  const [specialty, setSpecialty] = useState('All');
  const [selected, setSelected] = useState<Provider | null>(null);

  const specialties = useMemo(() => {
    const vals = Array.from(
      new Set(initialRows.map((r) => r.specialty).filter(Boolean))
    ).sort() as string[];
    return vals;
  }, [initialRows]);

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return initialRows.filter((r) => {
      const matchSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        (r.tagline || '').toLowerCase().includes(q) ||
        (r.about || '').toLowerCase().includes(q) ||
        (r.skills || []).some((s) => s.toLowerCase().includes(q));
      const matchSpecialty = specialty === 'All' || r.specialty === specialty;
      return matchSearch && matchSpecialty;
    });
  }, [initialRows, search, specialty]);

  return (
    <>
      {selected && <DrawerOverlay p={selected} onClose={() => setSelected(null)} />}

      <div className="min-h-screen bg-slate-50">
        {/* Hero banner */}
        <div className="bg-gradient-to-br from-emerald-700 to-teal-600 px-6 py-14 text-center text-white">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Environmental Service Providers
          </h1>
          <p className="mt-3 text-emerald-100 max-w-xl mx-auto text-sm sm:text-base">
            Find verified waste management consultants and environmental experts for EPR compliance,
            ESG reporting, and sustainability services.
          </p>
          <div className="mt-6 mx-auto max-w-lg">
            <input
              type="search"
              placeholder="Search by name, skill, or keyword…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border-0 px-4 py-3 text-slate-900 shadow-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Filters + count */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing <strong>{rows.length}</strong> of {initialRows.length} consultants
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSpecialty('All')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  specialty === 'All'
                    ? 'bg-emerald-600 text-white'
                    : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              {specialties.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpecialty((p) => (p === s ? 'All' : s))}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    specialty === s
                      ? 'bg-emerald-600 text-white'
                      : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {s.replace(' Consultant', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {rows.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-medium">No providers found</p>
              <p className="text-sm mt-1">Try a different search or clear the filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((p) => (
                <ProviderCard key={p.id} p={p} onSelect={setSelected} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
