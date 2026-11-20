'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export function IntelSearch() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/intel/companies?search=${encodeURIComponent(q)}`);
    setQuery('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search companies…"
        aria-label="Search intel companies"
        className="w-44 rounded-md border border-slate-700 bg-slate-950/80 px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 outline-none transition focus:border-teal-400 focus:w-56"
      />
      <button
        type="submit"
        aria-label="Search"
        className="rounded-md border border-slate-700 p-1 text-slate-400 transition hover:border-teal-400 hover:text-teal-300"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </button>
    </form>
  );
}
