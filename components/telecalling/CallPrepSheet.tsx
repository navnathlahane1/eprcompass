'use client';

// Feature 1: Call Prep Sheet
// Shows AI pitch, objection hints, company summary, and last call context before dialing

interface Props {
  lead: any;
  enrichment: any;
  lastCall?: any;
}

const QUICK_OBJECTIONS: { obj: string; rebuttal: string }[] = [
  {
    obj: 'We already have a consultant',
    rebuttal: 'That\'s great — we often work alongside existing consultants and add the compliance tracking and CPCB portal filing on top. Would you like a quick comparison?',
  },
  {
    obj: 'EPR doesn\'t apply to us',
    rebuttal: 'Based on your industry, you may be a registered brand owner / importer — let me send you a quick applicability check. Takes 2 minutes.',
  },
  {
    obj: 'We\'ll think about it / call later',
    rebuttal: 'Absolutely. When\'s a better time? FY26 deadlines are tight — I can block a 15-min slot for next week if that works.',
  },
  {
    obj: 'Too expensive',
    rebuttal: 'Our plans start at ₹15K for basic compliance. Non-compliance penalties from CPCB can be 10–50× that. Happy to share the fee schedule?',
  },
  {
    obj: 'Not interested',
    rebuttal: 'Understood. Just to mention — if you\'re importing or putting plastic / e-waste on the market, EPR registration is now mandatory. I\'ll send a brief so you have it handy.',
  },
];

function ScoreBar({ value, max = 100, color = 'teal' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const bg = color === 'teal' ? 'bg-teal-500' : color === 'amber' ? 'bg-amber-400' : 'bg-purple-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-700/40 rounded-full h-1.5">
        <div className={`${bg} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-300 w-8 text-right">{value}</span>
    </div>
  );
}

export default function CallPrepSheet({ lead, enrichment, lastCall }: Props) {
  const companyName = lead.company_name || lead.company || lead.name || 'this company';

  return (
    <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl border border-teal-500/20 p-5 space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-teal-400 text-lg">⚡</span>
        <h2 className="font-semibold text-slate-100">Call Prep Sheet</h2>
        <span className="ml-auto text-xs text-slate-500">AI-generated · for your eyes only</span>
      </div>

      {/* AI Pitch */}
      {enrichment?.recommended_pitch && (
        <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-4">
          <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-2">Opening Pitch</div>
          <p className="text-sm text-slate-200 leading-relaxed italic">"{enrichment.recommended_pitch}"</p>
        </div>
      )}

      {/* Intelligence scores */}
      {enrichment && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/60 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1.5">EPR Score</div>
            <ScoreBar value={enrichment.epr_applicability_score ?? 0} color="teal" />
          </div>
          <div className="bg-slate-800/60 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1.5">Lead Quality</div>
            <ScoreBar value={enrichment.lead_score ?? 0} color="amber" />
          </div>
          <div className="bg-slate-800/60 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1.5">Compliance %</div>
            <ScoreBar value={enrichment.compliance_probability ?? 0} color="purple" />
          </div>
        </div>
      )}

      {/* Key intel */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          ['Category', enrichment?.epr_category],
          ['Company Size', enrichment?.size_estimate],
          ['Decision Maker', enrichment?.decision_maker_estimate],
          ['Import/Export', enrichment?.import_export_activity],
        ].filter(([, v]) => v).map(([label, value]) => (
          <div key={String(label)} className="bg-slate-800/40 rounded px-3 py-2">
            <span className="text-slate-500">{label}: </span>
            <span className="text-slate-200 font-medium">{value}</span>
          </div>
        ))}
      </div>

      {/* AI summary */}
      {enrichment?.ai_summary && (
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Company Brief</div>
          <p className="text-sm text-slate-300 leading-relaxed">{enrichment.ai_summary}</p>
        </div>
      )}

      {/* Last call context */}
      {lastCall && (
        <div className="border-t border-slate-700/60 pt-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Last Call Context</div>
          <div className="text-xs text-slate-400">
            <span className="font-medium text-slate-300">{lastCall.disposition}</span>
            {lastCall.duration_seconds > 0 && ` · ${Math.round(lastCall.duration_seconds / 60)}m`}
            {' · '}
            {new Date(lastCall.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </div>
          {lastCall.notes && (
            <p className="text-xs text-slate-400 mt-1 italic">"{lastCall.notes}"</p>
          )}
          {lastCall.outcome_quote_sent && (
            <span className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-300 text-xs">Quote Sent</span>
          )}
          {lastCall.outcome_dm_identified && (
            <span className="inline-flex mt-1 ml-1 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs">DM Identified</span>
          )}
        </div>
      )}

      {/* Objection playbook (inline quick-ref) */}
      <div className="border-t border-slate-700/60 pt-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick Objection Rebuttals</div>
        <div className="space-y-2">
          {QUICK_OBJECTIONS.slice(0, 3).map((item, i) => (
            <details key={i} className="group">
              <summary className="cursor-pointer text-xs text-slate-300 flex items-center gap-1.5 py-1">
                <span className="text-slate-500 group-open:rotate-90 transition-transform inline-block">▶</span>
                {item.obj}
              </summary>
              <p className="text-xs text-slate-400 pl-4 pt-1 leading-relaxed">{item.rebuttal}</p>
            </details>
          ))}
          <a href="/telecalling/scripts?tab=objections" className="text-xs text-teal-400 hover:underline block pt-1">
            View full playbook →
          </a>
        </div>
      </div>
    </div>
  );
}
