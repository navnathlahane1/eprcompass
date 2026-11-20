'use client';

// Feature 4: Objection Playbook
// Searchable accordion of objections + approved rebuttals

import { useState } from 'react';

const DEFAULT_OBJECTIONS = [
  {
    category: 'Competition',
    obj: 'We already have a consultant',
    rebuttal: 'That\'s great — we often complement existing consultants. We handle CPCB/SPCB portal filing, certificate issuance, and compliance tracking. Would a quick comparison help?',
    tags: ['consultant', 'competitor'],
  },
  {
    category: 'Applicability',
    obj: 'EPR doesn\'t apply to us',
    rebuttal: 'Based on your industry, you may be a registered brand owner or importer — both are covered under EPR rules. Let me send you a 2-minute applicability check?',
    tags: ['not applicable', 'exempt'],
  },
  {
    category: 'Stall',
    obj: 'We\'ll think about it / call us later',
    rebuttal: 'Absolutely — when is a better time? FY26 deadlines are tight and slots fill up. I can block a 15-minute slot for next week if that suits.',
    tags: ['later', 'think', 'stall'],
  },
  {
    category: 'Price',
    obj: 'It\'s too expensive',
    rebuttal: 'Our plans start at ₹15K for basic compliance. Non-compliance penalties from CPCB range from ₹1–5L per year. Happy to share the fee schedule and a penalty comparison?',
    tags: ['cost', 'budget', 'price', 'expensive'],
  },
  {
    category: 'Not Interested',
    obj: 'Not interested',
    rebuttal: 'Understood. Just to flag — if you\'re putting plastic, e-waste, or batteries on the Indian market, EPR registration is now mandatory under MoEFCC rules. I\'ll send a quick brief for your records.',
    tags: ['no', 'not interested', 'refuse'],
  },
  {
    category: 'Decision Maker',
    obj: 'You\'ll need to speak with my boss / management',
    rebuttal: 'Of course. Could you share their name and a good time to reach them? Alternatively, I can send a short executive brief you could forward — takes 30 seconds to share.',
    tags: ['dm', 'manager', 'boss', 'decision maker'],
  },
  {
    category: 'Timing',
    obj: 'We\'ll handle it next quarter / year',
    rebuttal: 'Understood — but CPCB has started sending notices to non-registered entities this FY. Registration takes 4–6 weeks. Starting now means you\'re covered before deadline.',
    tags: ['later', 'next year', 'delay', 'quarter'],
  },
  {
    category: 'Trust',
    obj: 'We\'ve never heard of your company',
    rebuttal: 'Fair question. We\'ve helped 200+ producers and importers register on the CPCB portal. I\'ll send our client list and a couple of case studies — takes 2 minutes to review.',
    tags: ['trust', 'credibility', 'who are you', 'new'],
  },
  {
    category: 'Applicability',
    obj: 'We only import in small quantities',
    rebuttal: 'The EPR rules don\'t have a minimum quantity threshold for importers — even a single unit imported for resale triggers the obligation. Let me send the exact MoEFCC clause.',
    tags: ['small', 'quantity', 'import', 'importer'],
  },
  {
    category: 'Competition',
    obj: 'We\'re doing it in-house',
    rebuttal: 'That works for some companies. We often step in for the CPCB portal submissions and annual returns, which are time-consuming. Would an audit of your current process help?',
    tags: ['inhouse', 'in-house', 'self'],
  },
];

export default function ObjectionPlaybook() {
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', ...Array.from(new Set(DEFAULT_OBJECTIONS.map(o => o.category)))];

  const filtered = DEFAULT_OBJECTIONS.filter(o => {
    const q = search.toLowerCase();
    const matchesSearch = !q || o.obj.toLowerCase().includes(q) || o.rebuttal.toLowerCase().includes(q) || o.tags.some(t => t.includes(q));
    const matchesCat = categoryFilter === 'All' || o.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Search objections..."
          value={search}
          onChange={e => { setSearch(e.target.value); setOpenIndex(null); }}
          className="border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100 w-64 placeholder-slate-500"
        />
        <div className="flex gap-1 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${categoryFilter === cat ? 'bg-teal-500/20 border border-teal-500/40 text-teal-200' : 'bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-slate-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">No objections match your search</div>
      )}

      <div className="space-y-2">
        {filtered.map((item, i) => (
          <div
            key={i}
            className="bg-slate-900/60 border border-slate-700/60 rounded-xl overflow-hidden"
          >
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800/40 transition-colors"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {item.category}
                </span>
                <span className="text-sm font-medium text-slate-200">"{item.obj}"</span>
              </div>
              <span className={`text-slate-500 text-xs transition-transform ${openIndex === i ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {openIndex === i && (
              <div className="px-4 pb-4 pt-1">
                <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-3">
                  <div className="text-xs font-semibold text-teal-400 mb-1.5 uppercase tracking-wider">Your Rebuttal</div>
                  <p className="text-sm text-slate-200 leading-relaxed">"{item.rebuttal}"</p>
                </div>
                <div className="flex gap-1 mt-2">
                  {item.tags.map(t => (
                    <span key={t} className="px-1.5 py-0.5 text-xs bg-slate-800 text-slate-500 rounded">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
