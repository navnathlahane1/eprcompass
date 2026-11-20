"use client";

import { useMemo, useState } from 'react';

const TYPE_COLORS = {
  Public: 'bg-emerald-100 text-emerald-700',
  Protected: 'bg-amber-100 text-amber-700'
};

export default function PagesDirectoryClient({ pageDirectory }) {
  const [search, setSearch] = useState('');
  const [section, setSection] = useState('All');

  const sections = useMemo(
    () => ['All', ...Array.from(new Set((pageDirectory || []).map((page) => page.section)))],
    [pageDirectory]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (pageDirectory || []).filter((page) => {
      const matchSection = section === 'All' || page.section === section;
      const matchSearch =
        !q ||
        page.name.toLowerCase().includes(q) ||
        page.path.toLowerCase().includes(q) ||
        page.role.toLowerCase().includes(q);
      return matchSection && matchSearch;
    });
  }, [pageDirectory, search, section]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Pages Directory</h1>
        <p className="text-sm text-slate-500 mt-1">
          Auto-generated from App Router pages. Dynamic routes are excluded.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name, path, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <div className="flex gap-2 flex-wrap">
          {sections.map((item) => (
            <button
              key={item}
              onClick={() => setSection(item)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                section === item
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-slate-500">
        {filtered.length} of {(pageDirectory || []).length} pages
      </p>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-left">
                <th className="px-4 py-3 font-semibold text-slate-400">Section</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Page Name</th>
                <th className="px-4 py-3 font-semibold text-slate-400">URL Path</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Type</th>
                <th className="px-4 py-3 font-semibold text-slate-400">Role Required</th>
                <th className="px-4 py-3 font-semibold text-slate-400 text-right">Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((page) => (
                <tr key={page.path} className="hover:bg-slate-950 transition-colors">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{page.section}</td>
                  <td className="px-4 py-3 font-medium text-slate-100">{page.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{page.path}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        TYPE_COLORS[page.type] || ''
                      }`}
                    >
                      {page.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{page.role}</td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={page.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-800 font-medium text-xs"
                    >
                      Visit
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                      </svg>
                    </a>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No pages found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
