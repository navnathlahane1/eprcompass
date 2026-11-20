'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type SearchItem = {
  id: string;
  type: 'client' | 'lead' | 'recycler' | 'cepc';
  label: string;
  subtitle?: string;
  href: string;
};

function typeBadge(type: SearchItem['type']) {
  if (type === 'client') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
  if (type === 'lead') return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200';
  if (type === 'recycler') return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200';
  return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200';
}

export default function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const key = String(event.key || '').toLowerCase();
      if (!key) return;
      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (key === 'escape') {
        setOpen(false);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const q = query.trim();

      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, {
          credentials: 'same-origin',
          signal: controller.signal
        });
        const json = res.ok ? await res.json() : { results: [] };
        setResults(((json.results as SearchItem[]) || []).slice(0, 15));
        setActiveIndex(0);
      } catch (err) {
        if ((err as any)?.name !== 'AbortError') setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchItem[]>();
    for (const row of results) {
      const list = map.get(row.type) || [];
      list.push(row);
      map.set(row.type, list);
    }
    return map;
  }, [results]);

  useEffect(() => {
    if (!open) return;
    function onListNav(event: KeyboardEvent) {
      if (!results.length) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % results.length);
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const item = results[activeIndex];
        if (!item) return;
        router.push(item.href);
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onListNav);
    return () => window.removeEventListener('keydown', onListNav);
  }, [open, results, activeIndex, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4 sm:p-10" onClick={() => { setOpen(false); setQuery(''); }}>
      <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-800 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, leads, recyclers, CEPC consultants..."
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-blue-400 focus:ring dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          />
          <button
            type="button"
            aria-label="Close search"
            onClick={() => { setOpen(false); setQuery(''); }}
            className="rounded-md border border-gray-300 px-2 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 max-h-[60vh] overflow-y-auto">
          {loading ? <p className="text-sm text-gray-500 dark:text-gray-400">Searching...</p> : null}
          {!loading && !results.length ? <p className="text-sm text-gray-500 dark:text-gray-400">No results</p> : null}

          {!loading && Array.from(grouped.entries()).map(([type, items]) => (
            <div key={type} className="mb-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{type}</p>
              <div className="space-y-1">
                {items.map((item) => {
                  const index = results.findIndex((r) => r.id === item.id);
                  const active = index === activeIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        router.push(item.href);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.subtitle}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${typeBadge(item.type)}`}>
                        {item.type}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
