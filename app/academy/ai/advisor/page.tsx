'use client';

import { useState } from 'react';

const RISK_AREAS = [
  { area: 'Tyre Waste – No Distributor Training',            risk: 'High',   category: 'Tyre Waste EPR',    action: 'Schedule 2 distributor awareness sessions in Q3', deadline: '2026-07-31', regulation: 'Rule 17(1) - E-waste Rules 2022' },
  { area: 'Used Oil – Consumer Awareness Gap',               risk: 'High',   category: 'Used Oil EPR',      action: 'Conduct public awareness campaign in 3 cities',   deadline: '2026-08-15', regulation: 'Used Oil Management Rule 5(b)' },
  { area: 'C&D Waste – Zero Programs Conducted',            risk: 'Critical',category: 'C&D Waste EPR',    action: 'Initiate awareness program for contractor network', deadline: '2026-07-01', regulation: 'C&D Waste Rule 8' },
  { area: 'Battery Waste – Educational Institutions Untouched',risk:'Medium',category: 'Battery Waste EPR', action: 'Partner with 2 colleges for student awareness',    deadline: '2026-09-30', regulation: 'Battery Waste Management Rule 9' },
  { area: 'Plastic Waste – Customer Certificate Backlog',    risk: 'Low',    category: 'Plastic Waste EPR', action: 'Issue 156 pending certificates within 7 days',    deadline: '2026-06-07', regulation: 'Certification Requirement' },
];

const RISK_META: Record<string, string> = {
  Critical: 'bg-rose-600/20 text-rose-200 border-rose-500/40',
  High:     'bg-rose-500/15 text-rose-300',
  Medium:   'bg-amber-500/15 text-amber-300',
  Low:      'bg-emerald-500/15 text-emerald-300',
};

const RISK_ROW: Record<string, string> = {
  Critical: 'border-rose-500/20',
  High:     'border-rose-500/10',
  Medium:   '',
  Low:      '',
};

export default function AIAdvisorPage() {
  const [input, setInput]       = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Hello! I am your EPR Compliance Advisor. Ask me about your training obligations, stakeholder coverage gaps, evidence requirements, or annual return compliance status.' },
  ]);
  const [sending, setSending]   = useState(false);

  async function send() {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', text: userMsg }]);
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setMessages(m => [...m, { role: 'ai', text: `Based on your current EPR awareness activity log, here is my analysis:\n\n**Status:** Your plastic waste and e-waste programs are on track. However, I've identified critical gaps in tyre waste distributor coverage and no programs have been conducted for C&D waste category.\n\n**Recommended Actions:**\n1. Schedule tyre waste distributor training within 30 days (Compliance Risk: High)\n2. Initiate C&D waste contractor awareness (Compliance Risk: Critical)\n3. Issue 156 pending certificates to avoid evidence gaps\n\n**Evidence Status:** Your last awareness activity for ${userMsg.includes('tyre') ? 'Tyre Waste' : 'E-Waste'} meets regulatory requirements, but additional evidence documentation is recommended before the annual return filing.` }]);
    setSending(false);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-100">AI Compliance Advisor</h1>
        </div>
        <p className="text-sm text-slate-500">AI-powered EPR compliance advisor that identifies risks and recommends corrective actions.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Risk Areas */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800/80">
            <h2 className="text-sm font-semibold text-slate-200">Compliance Risk Areas</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">AI-identified risks requiring action</p>
          </div>
          <div className="divide-y divide-slate-800/60">
            {RISK_AREAS.map((r, i) => (
              <div key={i} className={`px-5 py-4 border-l-2 ${r.risk === 'Critical' ? 'border-l-rose-500' : r.risk === 'High' ? 'border-l-rose-400' : r.risk === 'Medium' ? 'border-l-amber-400' : 'border-l-emerald-400'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200">{r.area}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{r.regulation}</p>
                    <p className="text-[11px] text-indigo-400 mt-1">{r.action}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">Deadline: {new Date(r.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${RISK_META[r.risk]}`}>{r.risk}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Chat */}
        <div className="flex flex-col rounded-xl border border-slate-800/80 bg-[#0c1022] overflow-hidden h-[500px]">
          <div className="px-5 py-3 border-b border-slate-800/80">
            <p className="text-xs font-semibold text-slate-400">Ask the AI Compliance Advisor</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800/80 text-slate-300'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-slate-800/80 px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-slate-800/80 p-3">
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                placeholder="Ask about compliance gaps, evidence requirements…"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <button onClick={send} disabled={sending || !input.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50">
                Ask
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['What programs are overdue?', 'Show evidence gaps', 'Annual return readiness'].map(q => (
                <button key={q} onClick={() => { setInput(q); }}
                  className="rounded px-2 py-1 text-[10px] font-medium bg-slate-800 text-slate-400 hover:bg-slate-700 transition">
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
