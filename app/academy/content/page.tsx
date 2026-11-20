'use client';

import { useState } from 'react';
import {
  FileText, Video, Monitor, ClipboardList, HelpCircle,
  Download, Eye, Upload, Search, Filter, X, Plus,
  BookOpen, Film, Layers, FileCheck
} from 'lucide-react';

const KPI_CARDS = [
  { label: 'Total Assets', value: '0', icon: Layers, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { label: 'PDFs', value: '0', icon: FileText, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { label: 'Videos', value: '0', icon: Film, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: 'Slide Decks', value: '0', icon: Monitor, color: 'text-sky-400', bg: 'bg-sky-500/10' },
];

type FileType = 'PDF' | 'Video' | 'Slide Deck' | 'Assignment Brief' | 'Quiz';
type Tier = 'Tier 1' | 'Tier 2' | 'Tier 3';

interface ContentItem {
  id: string;
  filename: string;
  program: string;
  tier: Tier;
  module: string;
  week: number;
  type: FileType;
  uploadedDate: string;
  size: string;
}

const FILE_TYPE_CONFIG: Record<FileType, { icon: React.ComponentType<{ className?: string }>, color: string, bg: string }> = {
  'PDF': { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
  'Video': { icon: Video, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  'Slide Deck': { icon: Monitor, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  'Assignment Brief': { icon: ClipboardList, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  'Quiz': { icon: HelpCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
};

const MOCK_CONTENT: ContentItem[] = [];

export default function ContentLibraryPage() {
  const [tierFilter, setTierFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [moduleFilter, setModuleFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const tiers = ['All', 'Tier 1', 'Tier 2', 'Tier 3'];
  const types = ['All', 'PDF', 'Video', 'Slide Deck', 'Assignment Brief', 'Quiz'];
  const modules = ['All', ...Array.from(new Set(MOCK_CONTENT.map(c => c.module)))];

  const filtered = MOCK_CONTENT.filter(item => {
    const matchTier = tierFilter === 'All' || item.tier === tierFilter;
    const matchType = typeFilter === 'All' || item.type === typeFilter;
    const matchModule = moduleFilter === 'All' || item.module === moduleFilter;
    const matchSearch = item.filename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTier && matchType && matchModule && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#060910] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Library</h1>
          <p className="text-slate-400 text-sm mt-1">EPR Compass — All program content assets</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Upload Content
        </button>
      </div>

      {/* Upload Area */}
      {showUpload && (
        <div className="bg-[#0c1022] border-2 border-dashed border-indigo-500/40 rounded-xl p-8 text-center">
          <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">Drag & drop files here or click to browse</p>
          <p className="text-slate-500 text-sm mt-1">Supports PDF, MP4, PPTX, DOCX — max 500MB per file</p>
          <div className="flex gap-3 mt-4 justify-center">
            <select className="bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
              <option>Select Program</option>
              <option>EPR Essentials (Tier 1)</option>
              <option>EPR Consultant Pro (Tier 2)</option>
              <option>EPR Agency Master (Tier 3)</option>
            </select>
            <select className="bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300">
              <option>Select Module</option>
            </select>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Upload Files
            </button>
            <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-200 px-3 py-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPI_CARDS.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                <div className="text-slate-400 text-xs">{kpi.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-4 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search content..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#060910] border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400 text-sm">Tier:</span>
          <div className="flex gap-1">
            {tiers.map(t => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tierFilter === t ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">Type:</span>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-[#060910] border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            {types.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">Module:</span>
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="bg-[#060910] border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            {modules.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <span className="text-slate-500 text-sm ml-auto">{filtered.length} items</span>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">No records yet.</div>
        )}
        {filtered.map(item => {
          const cfg = FILE_TYPE_CONFIG[item.type];
          const Icon = cfg.icon;
          return (
            <div key={item.id} className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition-colors group">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg border ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-medium truncate" title={item.filename}>{item.filename}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{item.program} · Week {item.week}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>{item.type}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">{item.tier}</span>
              </div>
              <div className="mt-3 text-xs text-slate-500 flex justify-between">
                <span>{item.uploadedDate}</span>
                <span>{item.size}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-400 rounded-lg py-1.5 text-xs font-medium transition-colors">
                  <Eye className="w-3 h-3" /> Preview
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg py-1.5 text-xs font-medium transition-colors">
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

