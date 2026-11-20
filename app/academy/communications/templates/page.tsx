'use client';

import { useState } from 'react';

const TEMPLATES = [
  { id: '1', name: 'Welcome to EPR Academy', type: 'Enrollment', usageCount: 284, lastUsed: '2026-05-30', preview: 'Hi {{learner_name}}, welcome to EPR Academy! Your journey towards EPR compliance certification begins now...' },
  { id: '2', name: 'Session Reminder – 24 Hours', type: 'Session', usageCount: 1420, lastUsed: '2026-05-29', preview: 'Hi {{learner_name}}, your {{program_name}} session starts tomorrow at 10 AM IST. Zoom link: {{zoom_link}}...' },
  { id: '3', name: 'Assignment Due – 48 Hours', type: 'Session', usageCount: 876, lastUsed: '2026-05-29', preview: 'Hi {{learner_name}}, your assignment for {{program_name}} is due in 48 hours. Please submit on the portal...' },
  { id: '4', name: 'Certificate Issued', type: 'Certificate', usageCount: 512, lastUsed: '2026-05-28', preview: 'Congratulations {{learner_name}}! Your EPR {{program_name}} certificate is ready. Download at {{cert_download_url}}...' },
  { id: '5', name: 'Tier 2 Upgrade Offer', type: 'Upsell', usageCount: 198, lastUsed: '2026-05-27', preview: 'Hi {{learner_name}}, as a Tier 1 alumni you qualify for an exclusive ₹500 discount on Tier 2...' },
  { id: '6', name: 'Partner Monthly Payout', type: 'Partner', usageCount: 93, lastUsed: '2026-05-01', preview: 'Hi Partner, your monthly payout has been processed and will reflect in your account within 2 business days...' },
  { id: '7', name: 'EMI Payment Overdue', type: 'Payment', usageCount: 47, lastUsed: '2026-05-28', preview: 'Hi {{learner_name}}, your EMI payment for {{program_name}} is overdue. Please complete payment to continue access...' },
  { id: '8', name: 'Batch Filling Up Alert', type: 'Enrollment', usageCount: 134, lastUsed: '2026-05-26', preview: 'Only a few seats left in the upcoming {{program_name}} batch! Secure your seat with EPR Compass...' },
  { id: '9', name: 'Post-Session Feedback Survey', type: 'Session', usageCount: 741, lastUsed: '2026-05-29', preview: 'Hi {{learner_name}}, thank you for attending today\'s session. Please share your feedback — it takes 2 minutes...' },
  { id: '10', name: 'Partner New Referral Confirmed', type: 'Partner', usageCount: 218, lastUsed: '2026-05-25', preview: 'Great news! A new learner has enrolled using your referral code. Your commission will be credited this month...' },
  { id: '11', name: 'LinkedIn Share – Certificate', type: 'Certificate', usageCount: 302, lastUsed: '2026-05-28', preview: 'Share your EPR certification on LinkedIn and let your network know about your expertise! Template copy below...' },
  { id: '12', name: 'Tier 3 Upgrade Offer', type: 'Upsell', usageCount: 87, lastUsed: '2026-05-20', preview: 'Hi {{learner_name}}, as a Tier 2 alumni you qualify for an exclusive ₹1,500 discount on Tier 3...' },
];

const TYPE_COLORS: Record<string, string> = {
  Enrollment:  'bg-indigo-500/15 text-indigo-300',
  Session:     'bg-violet-500/15 text-violet-300',
  Certificate: 'bg-emerald-500/15 text-emerald-300',
  Partner:     'bg-teal-500/15 text-teal-300',
  Payment:     'bg-amber-500/15 text-amber-300',
  Upsell:      'bg-pink-500/15 text-pink-300',
};

const TYPES = ['All', 'Enrollment', 'Session', 'Certificate', 'Partner', 'Payment', 'Upsell'];

export default function TemplatesPage() {
  const [filter, setFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Session');
  const [newBody, setNewBody] = useState('');
  const [templates, setTemplates] = useState(TEMPLATES);
  const [editId, setEditId] = useState<string | null>(null);

  const filtered = filter === 'All' ? templates : templates.filter(t => t.type === filter);

  function handleDelete(id: string) {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }

  function handleDuplicate(t: typeof TEMPLATES[0]) {
    const newT = { ...t, id: String(Date.now()), name: t.name + ' (Copy)', usageCount: 0, lastUsed: '2026-05-30' };
    setTemplates(prev => [...prev, newT]);
  }

  function handleCreate() {
    if (!newName.trim()) return;
    const newT = { id: String(Date.now()), name: newName, type: newType, usageCount: 0, lastUsed: '2026-05-30', preview: newBody.slice(0, 100) + '…' };
    setTemplates(prev => [...prev, newT]);
    setNewName(''); setNewType('Session'); setNewBody(''); setShowCreate(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Template Library</h1>
          <p className="mt-0.5 text-sm text-slate-500">{templates.length} templates · reusable message blueprints</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Create Template
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex rounded-lg border border-slate-700 overflow-hidden w-fit flex-wrap">
        {TYPES.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-2 text-xs font-medium transition ${filter===t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>{t}</button>
        ))}
      </div>

      {/* Create panel */}
      {showCreate && (
        <div className="rounded-xl border border-indigo-500/30 bg-[#0c1022] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">New Template</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Template Name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Session Reminder – 1 Hour"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Type</label>
              <select value={newType} onChange={e => setNewType(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300">
                {TYPES.filter(t => t !== 'All').map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Message Body</label>
            <textarea value={newBody} onChange={e => setNewBody(e.target.value)} rows={4}
              placeholder="Hi {{learner_name}}, …"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition">Save Template</button>
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 transition">Cancel</button>
          </div>
        </div>
      )}

      {/* Templates grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t => (
          <div key={t.id} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{t.name}</p>
                <span className={`inline-block mt-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${TYPE_COLORS[t.type] ?? 'bg-slate-700 text-slate-400'}`}>{t.type}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{t.preview}</p>
            <div className="flex items-center justify-between text-[10px] text-slate-600">
              <span>Used {t.usageCount}×</span>
              <span>Last: {new Date(t.lastUsed).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex gap-2 pt-1 border-t border-slate-800/60">
              <button onClick={() => setEditId(t.id)} className="flex-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 py-1.5 text-[11px] font-medium text-indigo-300 hover:bg-indigo-500/20 transition">Edit</button>
              <button onClick={() => handleDuplicate(t)} className="flex-1 rounded-lg border border-slate-700 py-1.5 text-[11px] font-medium text-slate-400 hover:bg-slate-800 transition">Duplicate</button>
              <button onClick={() => handleDelete(t.id)} className="flex-1 rounded-lg border border-red-500/20 bg-red-500/5 py-1.5 text-[11px] font-medium text-red-400 hover:bg-red-500/15 transition">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-slate-600 text-sm">No templates in this category.</div>
      )}
    </div>
  );
}
