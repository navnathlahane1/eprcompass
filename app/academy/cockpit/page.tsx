'use client';

// ── Director Analytics Cockpit — Module 12 ────────────────────────────────────
// Full-screen executive dashboard for Academy Director (an EPR Compass expert)
// Pure CSS/Tailwind charts — no external chart libraries

const TODAY = new Date().toLocaleDateString('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

// ── Mini Bar Chart (pure CSS) ─────────────────────────────────────────────────
function MiniBar({ value, max, color = 'bg-indigo-500', label, sublabel }: {
  value: number; max: number; color?: string; label: string; sublabel: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-end h-14 w-8">
        <div
          className={`w-full rounded-t ${color} opacity-80 transition-all`}
          style={{ height: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-slate-500">{label}</span>
      <span className="text-[10px] font-semibold text-slate-300">{sublabel}</span>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct, color = 'bg-indigo-500', label, sublabel, achieved }: {
  pct: number; color?: string; label: string; sublabel: string; achieved?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400">{label}</span>
        <span className={`text-xs font-semibold ${achieved ? 'text-emerald-400' : 'text-slate-300'}`}>
          {achieved ? '✓ Achieved' : `${pct}%`}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${achieved ? 'bg-emerald-500' : color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-[10px] text-slate-600">{sublabel}</span>
    </div>
  );
}

// ── Funnel Step ───────────────────────────────────────────────────────────────
function FunnelStep({ label, count, color, conv }: {
  label: string; count: number; color: string; conv?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className={`rounded-full px-3 py-1.5 text-xs font-bold text-white ${color} whitespace-nowrap text-center`}>
        {count.toLocaleString('en-IN')}
      </div>
      <span className="text-[10px] text-slate-500 text-center leading-tight">{label}</span>
      {conv && <span className="text-[10px] text-slate-600">↓ {conv}</span>}
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0c1022] border border-slate-800/80 rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">{children}</h2>
  );
}

// ── Revenue Flywheel ──────────────────────────────────────────────────────────
function RevenueFlywheel() {
  const months = [
    { label: 'Jan', value: 0, display: '₹0' },
    { label: 'Feb', value: 0, display: '₹0' },
    { label: 'Mar', value: 0, display: '₹0' },
    { label: 'Apr', value: 0, display: '₹0' },
    { label: 'May', value: 0, display: '₹0' },
    { label: 'Jun', value: 0, display: '₹0' },
  ];
  const max = 1;

  return (
    <Card className="col-span-2">
      <SectionTitle>Revenue Flywheel</SectionTitle>
      <div className="flex flex-wrap gap-6 mb-5">
        <div>
          <p className="text-2xl font-bold text-white">₹0</p>
          <p className="text-xs text-slate-500">Current MRR (Gross)</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-emerald-400">₹0</p>
          <p className="text-xs text-slate-500">Net (after partner payouts)</p>
        </div>
        <div>
          <p className="text-lg font-bold text-indigo-400">0%</p>
          <p className="text-xs text-slate-500">MoM Growth</p>
        </div>
        <div>
          <p className="text-lg font-bold text-violet-400">₹0</p>
          <p className="text-xs text-slate-500">Annualised Run Rate</p>
        </div>
      </div>

      {/* 6-month bar chart */}
      <div className="flex items-end gap-3 mb-5 bg-slate-900/40 rounded-xl p-3">
        {months.map((m, i) => (
          <MiniBar
            key={m.label}
            value={m.value}
            max={max}
            color={i === months.length - 1 ? 'bg-indigo-500' : 'bg-slate-600'}
            label={m.label}
            sublabel={m.display}
          />
        ))}
        <div className="flex-1" />
        <span className="text-[10px] text-slate-600 self-start">Last 6 months</span>
      </div>

      {/* Milestone progress */}
      <div className="space-y-3">
        <ProgressBar pct={0} label="₹12K / month" sublabel="Milestone 1" />
        <ProgressBar pct={0} label="₹1L / month" sublabel="Milestone 2" />
        <ProgressBar pct={0} color="bg-indigo-500" label="₹10L / month" sublabel="Milestone 3" />
      </div>
    </Card>
  );
}

// ── Learner Pipeline Funnel ───────────────────────────────────────────────────
function LearnerPipeline() {
  const stages = [
    { label: 'Website Visits', count: 0, color: 'bg-slate-600', conv: '0%' },
    { label: 'Registrations', count: 0,  color: 'bg-indigo-700', conv: '0%' },
    { label: 'Enrollments',   count: 0,  color: 'bg-indigo-600', conv: '0%' },
    { label: 'Active',        count: 0,  color: 'bg-violet-600', conv: '0%' },
    { label: 'Completed',     count: 0,  color: 'bg-violet-500', conv: '0%' },
    { label: 'Certified',     count: 0,  color: 'bg-emerald-600', conv: '0%' },
    { label: 'Placed / Consulting', count: 0, color: 'bg-emerald-500' },
  ];

  return (
    <Card className="col-span-2">
      <SectionTitle>Learner Pipeline Funnel</SectionTitle>
      <div className="flex items-start gap-1 flex-wrap">
        {stages.map((s, i) => (
          <div key={s.label} className="flex items-center flex-1 min-w-[80px]">
            <FunnelStep label={s.label} count={s.count} color={s.color} conv={s.conv} />
            {i < stages.length - 1 && (
              <span className="text-slate-700 text-lg shrink-0 mb-4">›</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-600 mt-3">Conversion rates shown between stages</p>
    </Card>
  );
}

// ── Program Health ────────────────────────────────────────────────────────────
function ProgramHealth() {
  const tiers = [
    { name: 'Tier 1', enrolled: 0, nps: 0, completion: 0, revenue: '₹0', trend: '→' },
    { name: 'Tier 2', enrolled: 0, nps: 0, completion: 0, revenue: '₹0', trend: '→' },
    { name: 'Tier 3', enrolled: 0, nps: 0, completion: 0, revenue: '₹0', trend: '→' },
  ];

  return (
    <Card>
      <SectionTitle>Program Health</SectionTitle>
      <div className="grid grid-cols-3 gap-3">
        {tiers.map(t => (
          <div key={t.name} className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/60">
            <p className="text-sm font-bold text-indigo-300 mb-2">{t.name}</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Enrolled</span>
                <span className="text-slate-200 font-medium">{t.enrolled}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">NPS</span>
                <span className="text-emerald-400 font-medium">{t.nps}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Completion</span>
                <span className="text-slate-200 font-medium">{t.completion}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Revenue</span>
                <span className="text-violet-400 font-medium">{t.revenue}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Trend</span>
                <span className={`font-bold ${t.trend === '↑' ? 'text-emerald-400' : 'text-slate-400'}`}>{t.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Partner Performance ───────────────────────────────────────────────────────
function PartnerPerformance() {
  const partners: { rank: number; name: string; revenue: string; refs: number; nps: number }[] = [];

  return (
    <Card>
      <SectionTitle>Partner Performance</SectionTitle>
      <div className="space-y-2 mb-3">
        <div className="grid grid-cols-4 text-[10px] text-slate-600 uppercase tracking-wider pb-1 border-b border-slate-800">
          <span>#  Name</span>
          <span className="text-right">Revenue</span>
          <span className="text-right">Refs</span>
          <span className="text-right">NPS</span>
        </div>
        {partners.length === 0 && (
          <p className="text-xs text-slate-600 py-4 text-center">No records yet.</p>
        )}
        {partners.map(p => (
          <div key={p.rank} className="grid grid-cols-4 text-xs items-center py-1">
            <span className="text-slate-300 truncate">
              <span className="text-slate-600 mr-1.5">{p.rank}.</span>{p.name}
            </span>
            <span className="text-right text-violet-400 font-medium">{p.revenue}</span>
            <span className="text-right text-slate-400">{p.refs}</span>
            <span className={`text-right font-semibold ${p.nps >= 80 ? 'text-emerald-400' : 'text-slate-300'}`}>{p.nps}</span>
          </div>
        ))}
      </div>
      <a href="/academy/partners" className="text-xs text-indigo-400 hover:text-indigo-300 transition">View All Partners →</a>
    </Card>
  );
}

// ── T3 Pipeline ───────────────────────────────────────────────────────────────
function T3Pipeline() {
  return (
    <Card>
      <SectionTitle>T3 Pipeline</SectionTitle>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-indigo-300">0</p>
          <p className="text-[10px] text-slate-500 mt-1">In Queue</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-300">0</p>
          <p className="text-[10px] text-slate-500 mt-1">Certified This Month</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-300">0</p>
          <p className="text-[10px] text-slate-500 mt-1">Renewals in 30d</p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-[10px] text-slate-600 uppercase tracking-wider">Upcoming Renewals</p>
        <p className="text-xs text-slate-600 py-2">No records yet.</p>
      </div>
    </Card>
  );
}

// ── Cohort Health ─────────────────────────────────────────────────────────────
function CohortHealth() {
  const batches: { name: string; enrolled: number; cap: number; attendance: number | null; health: string; healthColor: string; barColor: string }[] = [];

  return (
    <Card>
      <SectionTitle>Cohort Health</SectionTitle>
      <div className="space-y-4">
        {batches.length === 0 && (
          <p className="text-xs text-slate-600 py-4 text-center">No records yet.</p>
        )}
        {batches.map(b => {
          const pct = Math.round((b.enrolled / b.cap) * 100);
          return (
            <div key={b.name}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-300 truncate">{b.name}</span>
                <span className={`text-[10px] font-bold ml-2 shrink-0 ${b.healthColor}`}>{b.health}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 mb-1">
                <div className={`h-full rounded-full ${b.barColor}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>{b.enrolled}/{b.cap} enrolled ({pct}%)</span>
                <span>{b.attendance !== null ? `Attendance: ${b.attendance}%` : 'Not started'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Financial Snapshot ────────────────────────────────────────────────────────
function FinancialSnapshot() {
  return (
    <Card>
      <SectionTitle>Financial Snapshot</SectionTitle>
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <p className="text-sm font-bold text-white">₹0</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Gross MRR</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <p className="text-sm font-bold text-emerald-400">₹0</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Net MRR</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <p className="text-sm font-bold text-violet-400">₹0</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Partner Payouts</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
            <p className="text-sm font-bold text-amber-400">₹0</p>
            <p className="text-[10px] text-slate-500 mt-0.5">GST Due</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
            <p className="text-sm font-bold text-amber-400">₹0</p>
            <p className="text-[10px] text-slate-500 mt-0.5">EMI Due</p>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-center">
            <p className="text-sm font-bold text-rose-400">₹0</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Overdue Invoices</p>
          </div>
        </div>
      </div>
      <a href="/academy/finance" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 transition">
        View Finance →
      </a>
    </Card>
  );
}

// ── 30-Day Action Items ───────────────────────────────────────────────────────
type ActionStatus = 'done' | 'pending' | 'urgent';

function ActionItem({ status, label, due, href = '#' }: {
  status: ActionStatus; label: string; due: string; href?: string;
}) {
  const badge = {
    done:    { icon: '✓', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', label: 'DONE'    },
    pending: { icon: '○', bg: 'bg-slate-800/60 border-slate-700/40',     text: 'text-slate-400',   label: 'PENDING' },
    urgent:  { icon: '!', bg: 'bg-rose-500/10 border-rose-500/20',       text: 'text-rose-400',    label: 'URGENT'  },
  }[status];

  return (
    <a
      href={href}
      className={`flex items-start gap-3 rounded-xl p-3 border transition hover:bg-white/5 cursor-pointer ${badge.bg}`}
    >
      <span className={`shrink-0 mt-0.5 text-xs font-bold w-4 text-center ${badge.text}`}>{badge.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-xs ${status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{label}</p>
        <p className="text-[10px] text-slate-600 mt-0.5">{due}</p>
      </div>
      <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${badge.text} ${badge.bg} border`}>
        {badge.label}
      </span>
    </a>
  );
}

function ActionItems() {
  const items: { status: ActionStatus; label: string; due: string; href: string }[] = [];

  return (
    <Card className="col-span-2">
      <SectionTitle>30-Day Action Items</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.length === 0 && (
          <p className="text-xs text-slate-600 py-4 col-span-2 text-center">No action items yet.</p>
        )}
        {items.map((item, i) => (
          <ActionItem key={i} {...item} />
        ))}
      </div>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DirectorCockpitPage() {
  return (
    <div className="min-h-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">
            Good morning 👋 Here&apos;s your EPR Academy overview
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{TODAY}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
          <span className="text-xs text-slate-600">Auto-refreshes every 5 min</span>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Row 1: Revenue Flywheel (col-span-2) + T3 Pipeline */}
        <RevenueFlywheel />
        <T3Pipeline />

        {/* Row 2: Learner Pipeline (col-span-2) + Financial Snapshot */}
        <LearnerPipeline />
        <FinancialSnapshot />

        {/* Row 3: Program Health (full width) */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <SectionTitle>Program Health by Tier</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'Tier 1 — CEPC',    enrolled: 0, nps: 0, completion: 0, revenue: '₹0', trend: '→', title: 'text-indigo-300', bar: 'bg-indigo-500', rev: 'text-indigo-400' },
              { name: 'Tier 2 — EALP',    enrolled: 0, nps: 0, completion: 0, revenue: '₹0', trend: '→', title: 'text-violet-300', bar: 'bg-violet-500', rev: 'text-violet-400' },
              { name: 'Tier 3 — Partner', enrolled: 0, nps: 0, completion: 0, revenue: '₹0', trend: '→', title: 'text-emerald-300', bar: 'bg-emerald-500', rev: 'text-emerald-400' },
            ].map(t => (
              <div key={t.name} className="bg-slate-900/40 rounded-xl p-4 border border-slate-800/60">
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-sm font-bold ${t.title}`}>{t.name}</p>
                  <span className={`text-lg font-bold ${t.trend === '↑' ? 'text-emerald-400' : 'text-slate-400'}`}>{t.trend}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500">Enrolled</p>
                    <p className="text-slate-200 font-semibold text-sm">{t.enrolled}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Avg NPS</p>
                    <p className="text-emerald-400 font-semibold text-sm">{t.nps}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Completion</p>
                    <p className="text-slate-200 font-semibold text-sm">{t.completion}%</p>
                    <div className="h-1 w-full rounded-full bg-slate-800 mt-1">
                      <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${t.completion}%` }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500">Revenue</p>
                    <p className={`${t.rev} font-semibold text-sm`}>{t.revenue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Row 4: Partner Performance + Cohort Health */}
        <PartnerPerformance />
        <div className="col-span-1 md:col-span-1 lg:col-span-2">
          <CohortHealth />
        </div>

        {/* Row 5: Action Items (col-span-2) */}
        <ActionItems />
      </div>
    </div>
  );
}
