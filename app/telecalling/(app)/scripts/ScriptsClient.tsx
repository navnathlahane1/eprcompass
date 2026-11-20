'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import TelecallerEmailsTab from './TelecallerEmailsTab';
import ObjectionPlaybook from '@/components/telecalling/ObjectionPlaybook';
import { placeTeluguAfterTamil } from '@/lib/telecalling/scriptOrder';

type TabType = 'scripts' | 'emails' | 'objections';

export default function ScriptsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') || 'scripts';
  const [activeTab, setActiveTab] = useState<TabType>(
    tabParam === 'emails' ? 'emails' : tabParam === 'objections' ? 'objections' : 'scripts'
  );

  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (activeTab !== 'scripts') return;

    fetch('/api/admin/telecalling/scripts?active_only=true')
      .then(r => r.json())
      .then(d => {
        const list = placeTeluguAfterTamil(d.scripts || []);
        setScripts(list);
        if (list.length > 0) setSelected(list[0]);
        setLoading(false);
      });
  }, [activeTab]);

  useEffect(() => {
    const nextTab = tabParam === 'emails' ? 'emails' : tabParam === 'objections' ? 'objections' : 'scripts';
    setActiveTab(nextTab as TabType);
  }, [tabParam]);

  const filtered = scripts.filter((s: any) =>
    !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.category?.toLowerCase().includes(search.toLowerCase())
  );

  function switchTab(nextTab: TabType) {
    setActiveTab(nextTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', nextTab);
    router.replace(`/telecalling/scripts?${params.toString()}`);
  }

  const TABS: { id: TabType; label: string }[] = [
    { id: 'scripts', label: 'Scripts' },
    { id: 'emails', label: 'Emails' },
    { id: 'objections', label: '🛡 Objections' },
  ];

  function TabBar() {
    return (
      <div className="mb-5 flex items-center gap-2 border-b border-slate-700/60 pb-2">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${activeTab === t.id ? 'bg-teal-500/15 font-semibold text-teal-300' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    );
  }

  if (activeTab === 'emails') {
    return (
      <div>
        <TabBar />
        <TelecallerEmailsTab />
      </div>
    );
  }

  if (activeTab === 'objections') {
    return (
      <div>
        <TabBar />
        <h1 className="text-xl font-bold text-slate-100 mb-5">Objection Playbook</h1>
        <ObjectionPlaybook />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <TabBar />
        <div className="text-center py-12 text-slate-500">Loading scripts…</div>
      </div>
    );
  }

  return (
    <div>
      <TabBar />

      <h1 className="text-xl font-bold text-slate-100 mb-5">Call Scripts</h1>

      <div className="flex gap-4" style={{ height: 'calc(100vh - 140px)' }}>
        {/* Script list */}
        <div className="w-64 flex-shrink-0 flex flex-col bg-slate-900/60 rounded-xl border border-slate-700/60 overflow-hidden">
          <div className="p-3 border-b border-slate-700/60">
            <input
              type="search"
              placeholder="Search scripts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-slate-700 rounded-lg px-3 py-1.5 text-sm bg-slate-900/60 text-slate-100"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">No scripts</div>
            ) : (
              filtered.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-800 transition-colors ${selected?.id === s.id ? 'bg-teal-500/10' : 'hover:bg-slate-800/40'}`}
                >
                  <div className={`text-sm font-medium ${selected?.id === s.id ? 'text-teal-300' : 'text-slate-200'}`}>
                    {s.title}
                  </div>
                  {s.category && (
                    <div className="text-xs text-slate-500 mt-0.5">{s.category}</div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Script detail */}
        <div className="flex-1 bg-slate-900/60 rounded-xl border border-slate-700/60 overflow-y-auto">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">Select a script</div>
          ) : (
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">{selected.title}</h2>
                  {selected.category && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded-full">{selected.category}</span>
                  )}
                </div>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300 leading-relaxed">
                {selected.content}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
