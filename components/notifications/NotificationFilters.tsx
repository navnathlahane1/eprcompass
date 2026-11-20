'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

interface FilterOption { value: string; label: string; }

const EPR_TYPES: FilterOption[] = [
  { value: '',          label: 'All EPR Types' },
  { value: 'Plastic',   label: '♻ Plastic Waste' },
  { value: 'E-Waste',   label: '💻 E-Waste' },
  { value: 'Battery',   label: '🔋 Battery' },
  { value: 'Tyre',      label: '🚗 Tyre Waste' },
  { value: 'Used-Oil',  label: '🛢 Used Oil' },
  { value: 'C&D',       label: '🏗 Construction' },
  { value: 'Hazardous', label: '⚗ Hazardous' },
  { value: 'Biomedical',label: '🏥 Biomedical' },
];

const AUTHORITIES: FilterOption[] = [
  { value: '',       label: 'All Authorities' },
  { value: 'cpcb',   label: 'CPCB' },
  { value: 'moefcc', label: 'MoEF&CC' },
  { value: 'mpcb',   label: 'MPCB' },
  { value: 'kspcb',  label: 'KSPCB' },
  { value: 'tnpcb',  label: 'TNPCB' },
  { value: 'dpcc',   label: 'DPCC' },
  { value: 'gpcb',   label: 'GPCB' },
];

const YEARS: FilterOption[] = [
  { value: '',     label: 'All Years' },
  ...Array.from({ length: 8 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { value: String(y), label: String(y) };
  }),
];

const SORT_OPTIONS: FilterOption[] = [
  { value: 'date_desc', label: 'Newest First' },
  { value: 'date_asc',  label: 'Oldest First' },
];

interface Props {
  total?: number;
  onSearch?: (q: string) => void;
}

export default function NotificationFilters({ total }: Props) {
  const router         = useRouter();
  const pathname       = usePathname();
  const searchParams   = useSearchParams();
  const [pending, startTransition] = useTransition();

  const currentQ         = searchParams.get('q')         || '';
  const currentEprType   = searchParams.get('epr_type')  || '';
  const currentAuthority = searchParams.get('authority') || '';
  const currentYear      = searchParams.get('year')      || '';
  const currentSort      = searchParams.get('sort')      || 'date_desc';

  const hasActiveFilters = !!(currentQ || currentEprType || currentAuthority || currentYear);

  const updateParam = useCallback((key: string, value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else       params.delete(key);
      params.delete('page'); // reset pagination on filter change
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [searchParams, pathname, router]);

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push(pathname);
    });
  }, [pathname, router]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search notifications, circulars, guidelines…"
          defaultValue={currentQ}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateParam('q', (e.target as HTMLInputElement).value.trim());
            }
          }}
          onChange={(e) => {
            if (!e.target.value) updateParam('q', '');
          }}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
        />
        {currentQ && (
          <button
            onClick={() => updateParam('q', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2">
        {/* EPR Type */}
        <div className="relative">
          <select
            value={currentEprType}
            onChange={(e) => updateParam('epr_type', e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none bg-white cursor-pointer">
            {EPR_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Authority */}
        <div className="relative">
          <select
            value={currentAuthority}
            onChange={(e) => updateParam('authority', e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none bg-white cursor-pointer">
            {AUTHORITIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Year */}
        <div className="relative">
          <select
            value={currentYear}
            onChange={(e) => updateParam('year', e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none bg-white cursor-pointer">
            {YEARS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="relative ml-auto">
          <select
            value={currentSort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none bg-white cursor-pointer">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Active filters + result count */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {currentEprType && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
              {currentEprType}
              <button onClick={() => updateParam('epr_type', '')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {currentAuthority && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
              {currentAuthority.toUpperCase()}
              <button onClick={() => updateParam('authority', '')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {currentYear && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
              {currentYear}
              <button onClick={() => updateParam('year', '')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {hasActiveFilters && (
            <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
        </div>

        {total !== undefined && (
          <span className="text-xs text-gray-400">
            {pending ? 'Filtering…' : `${total.toLocaleString()} result${total !== 1 ? 's' : ''}`}
          </span>
        )}
      </div>
    </div>
  );
}
