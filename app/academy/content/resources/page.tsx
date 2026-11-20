'use client';

import { useState } from 'react';
import { FileText, FileSpreadsheet, Download, RefreshCw, Tag, Search } from 'lucide-react';

type Category = 'All' | 'Plastic Waste' | 'E-Waste' | 'Battery Waste' | 'Tyre Waste';
type DocType = 'PDF' | 'Excel' | 'Word';

interface Resource {
  id: string;
  name: string;
  type: DocType;
  category: Category | Category[];
  description: string;
  lastUpdated: string;
  size: string;
  downloads: number;
}

const MOCK_RESOURCES: Resource[] = [
  {
    id: '1',
    name: 'PWM Rules 2022 — Plastic Waste Management',
    type: 'PDF',
    category: 'Plastic Waste',
    description: 'Complete text of the Plastic Waste Management (Amendment) Rules 2022 with Schedule I–IV and producer liability framework.',
    lastUpdated: '2022-08-15',
    size: '3.2 MB',
    downloads: 412,
  },
  {
    id: '2',
    name: 'E-Waste Management Rules 2022',
    type: 'PDF',
    category: 'E-Waste',
    description: 'Full regulatory document covering producer EPR targets, PRO registration, bulk consumer obligations, and disposal norms.',
    lastUpdated: '2022-11-01',
    size: '4.7 MB',
    downloads: 287,
  },
  {
    id: '3',
    name: 'Battery Waste Management Rules 2022',
    type: 'PDF',
    category: 'Battery Waste',
    description: 'Comprehensive rules for battery producers, importers, and recyclers including collection targets and EPR credit framework.',
    lastUpdated: '2022-08-24',
    size: '2.9 MB',
    downloads: 198,
  },
  {
    id: '4',
    name: 'Tyre Waste Management Rules 2022',
    type: 'PDF',
    category: 'Tyre Waste',
    description: 'Regulatory framework for tyre manufacturers and importers including retreading targets and EPR obligations.',
    lastUpdated: '2022-07-12',
    size: '2.1 MB',
    downloads: 143,
  },
  {
    id: '5',
    name: 'CPCB EPR Portal Guide v3.0',
    type: 'PDF',
    category: 'All',
    description: 'Official step-by-step guide for registration, annual filing, credit purchase, and PRO linking on the CPCB EPR portal.',
    lastUpdated: '2026-01-10',
    size: '8.4 MB',
    downloads: 634,
  },
  {
    id: '6',
    name: 'EPR Registration Checklist — All Categories',
    type: 'PDF',
    category: 'All',
    description: 'Master checklist of documents required for EPR registration across Plastic, E-Waste, Battery, and Tyre categories.',
    lastUpdated: '2026-03-05',
    size: '0.9 MB',
    downloads: 521,
  },
  {
    id: '7',
    name: 'Producer Liability Calculator',
    type: 'Excel',
    category: 'All',
    description: 'Automated Excel tool to calculate annual EPR targets, credit requirements, and shortfall penalties for any producer category.',
    lastUpdated: '2026-04-20',
    size: '1.4 MB',
    downloads: 389,
  },
  {
    id: '8',
    name: 'Extended Producer Responsibility FAQ',
    type: 'PDF',
    category: 'All',
    description: '65 frequently asked questions on EPR compliance, portal issues, credit trading, and regulatory interpretations.',
    lastUpdated: '2026-02-28',
    size: '2.3 MB',
    downloads: 476,
  },
  {
    id: '9',
    name: 'EPR Credit Trading Guide',
    type: 'PDF',
    category: 'All',
    description: 'Practical guide to buying and selling EPR certificates/credits on the CPCB portal marketplace with pricing benchmarks.',
    lastUpdated: '2026-03-15',
    size: '1.8 MB',
    downloads: 312,
  },
  {
    id: '10',
    name: 'State PCB Contact Directory 2026',
    type: 'PDF',
    category: 'All',
    description: 'Complete directory of State Pollution Control Board EPR nodal officers, emails, and phone numbers across all 28 states.',
    lastUpdated: '2026-05-01',
    size: '0.7 MB',
    downloads: 267,
  },
  {
    id: '11',
    name: 'Plastic Waste EPR Annual Return Template',
    type: 'Excel',
    category: 'Plastic Waste',
    description: 'Pre-filled Excel template for submitting Annual Return for plastic producers — aligned with CPCB portal format.',
    lastUpdated: '2026-04-10',
    size: '0.6 MB',
    downloads: 221,
  },
  {
    id: '12',
    name: 'E-Waste PRO Agreement Template',
    type: 'Word',
    category: 'E-Waste',
    description: 'Standard agreement template between E-waste producers and registered PROs — legally reviewed for FY 2025-26.',
    lastUpdated: '2026-03-22',
    size: '0.3 MB',
    downloads: 158,
  },
  {
    id: '13',
    name: 'Battery Waste Collection Target Calculator',
    type: 'Excel',
    category: 'Battery Waste',
    description: 'Category-wise collection target calculator for battery waste producers based on previous year sales data.',
    lastUpdated: '2026-02-14',
    size: '0.8 MB',
    downloads: 134,
  },
  {
    id: '14',
    name: 'Tyre Waste Retreading Compliance Guide',
    type: 'PDF',
    category: 'Tyre Waste',
    description: 'Step-by-step compliance guide for tyre manufacturers including retreading target calculation and authorized recycler listing.',
    lastUpdated: '2026-01-30',
    size: '1.5 MB',
    downloads: 97,
  },
  {
    id: '15',
    name: 'EPR Compliance Calendar FY 2026-27',
    type: 'PDF',
    category: 'All',
    description: 'Month-wise compliance calendar with all CPCB portal filing deadlines, credit cycle dates, and mandatory reporting periods.',
    lastUpdated: '2026-04-01',
    size: '0.5 MB',
    downloads: 548,
  },
];

const CATEGORY_TABS: Category[] = ['All', 'Plastic Waste', 'E-Waste', 'Battery Waste', 'Tyre Waste'];

const CATEGORY_COLORS: Record<string, string> = {
  'All': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  'Plastic Waste': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'E-Waste': 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  'Battery Waste': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  'Tyre Waste': 'bg-sky-500/10 text-sky-400 border-sky-500/30',
};

const TYPE_CONFIG: Record<DocType, { icon: React.ComponentType<{ className?: string }>, color: string }> = {
  'PDF': { icon: FileText, color: 'text-red-400' },
  'Excel': { icon: FileSpreadsheet, color: 'text-emerald-400' },
  'Word': { icon: FileText, color: 'text-blue-400' },
};

export default function ResourceHubPage() {
  const [activeTab, setActiveTab] = useState<Category>('All');
  const [search, setSearch] = useState('');

  const filtered = MOCK_RESOURCES.filter(r => {
    const matchCat = activeTab === 'All' || r.category === activeTab || r.category === 'All' || (Array.isArray(r.category) && r.category.includes(activeTab));
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#060910] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Resource Hub</h1>
          <p className="text-slate-400 text-sm mt-1">EPR Compass — Regulatory documents and compliance tools</p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <div className="text-slate-300 font-medium">{MOCK_RESOURCES.length} documents</div>
          <div>{MOCK_RESOURCES.reduce((a, b) => a + b.downloads, 0).toLocaleString()} total downloads</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search resources..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#0c1022] border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORY_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${activeTab === tab ? CATEGORY_COLORS[tab] : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-slate-500 text-sm">{filtered.length} resources found</p>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(resource => {
          const typeCfg = TYPE_CONFIG[resource.type];
          const Icon = typeCfg.icon;
          const catArr = Array.isArray(resource.category) ? resource.category : [resource.category];

          return (
            <div key={resource.id} className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition-colors flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-5 h-5 ${typeCfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-slate-200 font-medium text-sm leading-tight">{resource.name}</h3>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[resource.type === 'Excel' ? 'Plastic Waste' : resource.type === 'Word' ? 'E-Waste' : 'All']}`}>
                      {resource.type}
                    </span>
                    {catArr.map(c => (
                      <span key={c} className={`px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[c]}`}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed flex-1 mb-4">{resource.description}</p>

              <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Updated {resource.lastUpdated}</span>
                <span>{resource.downloads.toLocaleString()} downloads · {resource.size}</span>
              </div>

              <button className="w-full flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-400 rounded-lg py-2 text-sm font-medium transition-colors">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

