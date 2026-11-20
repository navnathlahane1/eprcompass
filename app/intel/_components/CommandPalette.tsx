'use client';

/**
 * ⌘K / Ctrl+K command palette for the Intel workspace.
 * - Fuzzy-searches intel_companies by name
 * - Lists navigation shortcuts
 * - Keyboard navigable (↑↓ + Enter)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { INTEL_GROUP_LABELS, INTEL_NAV_ITEMS } from '@/app/intel/_config/intelNav';

type CompanyHit = {
  id: string;
  canonical_name: string;
  state: string | null;
  segment_tag: string | null;
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen]           = useState(false);
  const [query, setQuery]         = useState('');
  const [hits, setHits]           = useState<CompanyHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [selIdx, setSelIdx]       = useState(0);
  const inputRef  = useRef<HTMLInputElement>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Toggle on ⌘K / Ctrl+K ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen((v) => !v); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Auto-focus + reset on open ─────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
      setQuery(''); setHits([]); setSelIdx(0);
    }
  }, [open]);

  // ── Company search with debounce ───────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = query.trim();
    if (q.length < 2) { setHits([]); return; }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from('intel_companies')
        .select('id, canonical_name, state, segment_tag')
        .ilike('canonical_name', `%${q}%`)
        .limit(8);
      setHits((data || []) as CompanyHit[]);
      setSearching(false);
      setSelIdx(0);
    }, 220);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const filteredNav = query.trim()
    ? INTEL_NAV_ITEMS.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.desc.toLowerCase().includes(query.toLowerCase()) ||
        INTEL_GROUP_LABELS[c.group].toLowerCase().includes(query.toLowerCase())
      )
    : INTEL_NAV_ITEMS;

  // Flat list: companies first, then nav
  const allItems = [
    ...hits.map((c, i)         => ({ type: 'company' as const, data: c, idx: i })),
    ...filteredNav.map((c, i)  => ({ type: 'nav' as const,     data: c, idx: hits.length + i })),
  ];

  const groupedNav = filteredNav.reduce<Record<string, typeof filteredNav>>((acc, item) => {
    const key = item.group;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const go = useCallback((idx: number) => {
    const item = allItems.find((a) => a.idx === idx);
    if (!item) return;
    setOpen(false);
    if (item.type === 'company') {
      router.push(`/intel/companies/${item.data.id}?from=companies`);
    } else {
      router.push(item.data.href);
    }
  }, [allItems, router]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelIdx((i) => Math.min(i + 1, allItems.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(selIdx); }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-[999] flex items-start justify-center bg-black/70 pt-[12vh] backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">

        {/* ── Search input ─────────────────────────────────────── */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search companies or jump to a page…"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
          />
          {searching && (
            <span className="animate-pulse text-[10px] text-slate-500">searching…</span>
          )}
          <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">ESC</kbd>
        </div>

        {/* ── Results ──────────────────────────────────────────── */}
        <div className="max-h-[340px] overflow-y-auto py-1">

          {/* Company hits */}
          {hits.length > 0 && (
            <div>
              <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Companies
              </p>
              {hits.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => go(i)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                    selIdx === i
                      ? 'bg-teal-500/15 text-teal-100'
                      : 'text-slate-200 hover:bg-slate-800/70'
                  }`}
                >
                  <span className="text-base">🏢</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.canonical_name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {[c.segment_tag, c.state].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">↗</span>
                </button>
              ))}
              {filteredNav.length > 0 && (
                <div className="mx-4 my-1 border-t border-slate-800/60" />
              )}
            </div>
          )}

          {/* Nav commands */}
          {filteredNav.length > 0 && (
            <div>
              {Object.entries(groupedNav).map(([group, items]) => (
                <div key={group}>
                  <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    {INTEL_GROUP_LABELS[group as keyof typeof INTEL_GROUP_LABELS]}
                  </p>
                  {items.map((c) => {
                    const navIndex = filteredNav.findIndex((item) => item.id === c.id);
                    const abs = hits.length + navIndex;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => go(abs)}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition ${
                          selIdx === abs
                            ? 'bg-slate-700/60 text-slate-100'
                            : 'text-slate-300 hover:bg-slate-800/70'
                        }`}
                      >
                        <span className="w-5 text-center text-sm">{c.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{c.label}</p>
                          <p className="text-xs text-slate-500">{c.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {query.trim().length >= 2 && !searching && allItems.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>

        {/* ── Footer hints ─────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4 border-t border-slate-800 px-4 py-2 text-[10px] text-slate-500">
          <span><kbd className="mr-1 rounded bg-slate-800 px-1">↑↓</kbd>navigate</span>
          <span><kbd className="mr-1 rounded bg-slate-800 px-1">↵</kbd>open</span>
          <span><kbd className="mr-1 rounded bg-slate-800 px-1">esc</kbd>close</span>
          <span className="ml-auto opacity-50">⌘K to toggle</span>
        </div>
      </div>
    </div>
  );
}
