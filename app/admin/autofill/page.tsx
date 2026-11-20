'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Database, Globe, Link2, Activity, Shield, Zap, Eye, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { AUTOMATION_TIER_CONFIG, SESSION_STATUS_CONFIG } from '@/lib/autofill/constants';

interface HubStats {
  global_fields: { total: number; active: number };
  portals: { total: number; active: number; by_tier: Record<string, number> };
  mappings: { total: number; low_confidence: number; unverified: number };
  sessions: { total: number; completed: number; failed: number; avg_confidence: number | null };
}

export default function AutofillHubPage() {
  const [stats, setStats] = useState<HubStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/autofill/global-fields').then(r => r.json()),
      fetch('/api/admin/autofill/portals').then(r => r.json()),
      fetch('/api/admin/autofill/mappings').then(r => r.json()),
      fetch('/api/admin/autofill/sessions?limit=10').then(r => r.json()),
    ]).then(([fields, portals, mappings, sessions]) => {
      const tierBreakdown: Record<string, number> = {};
      for (const p of portals.portals || []) {
        tierBreakdown[p.automation_tier] = (tierBreakdown[p.automation_tier] || 0) + 1;
      }
      setStats({
        global_fields: {
          total: fields.fields?.length || 0,
          active: fields.fields?.filter((f: { is_active: boolean }) => f.is_active).length || 0,
        },
        portals: {
          total: portals.portals?.length || 0,
          active: portals.portals?.filter((p: { is_active: boolean }) => p.is_active).length || 0,
          by_tier: tierBreakdown,
        },
        mappings: {
          total: mappings.mappings?.length || 0,
          low_confidence: mappings.mappings?.filter((m: { confidence_score: number }) => m.confidence_score < 70).length || 0,
          unverified: mappings.mappings?.filter((m: { last_verified_at: string | null }) => !m.last_verified_at).length || 0,
        },
        sessions: sessions.stats || { total: 0, completed: 0, failed: 0, avg_confidence: null },
      });
      setRecentSessions(sessions.sessions?.slice(0, 8) || []);
      setLoading(false);
    });
  }, []);

  const navCards = [
    {
      href: '/admin/autofill/global-fields',
      icon: Database,
      title: 'Global Field Definitions',
      description: 'Manage the universal GLOBAL_ field schema used across all portals.',
      color: 'bg-blue-950/30 text-blue-400',
    },
    {
      href: '/admin/autofill/portals',
      icon: Globe,
      title: 'Portal Registry',
      description: 'Register government portals, detection rules, and form structures.',
      color: 'bg-violet-950/30 text-violet-400',
    },
    {
      href: '/admin/autofill/mappings',
      icon: Link2,
      title: 'Field Mappings',
      description: 'Map GLOBAL_ fields to portal CSS/XPath selectors with confidence scores.',
      color: 'bg-emerald-950/30 text-emerald-400',
    },
    {
      href: '/admin/autofill/sessions',
      icon: Activity,
      title: 'Session Logs',
      description: 'Inspect Chrome Extension autofill sessions and per-field fill logs.',
      color: 'bg-orange-950/30 text-orange-400',
    },
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Zap className="w-6 h-6 text-indigo-400" />
          Autofill Engine
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Universal data mapping layer — enter once, autofill any government portal.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Global Fields" value={stats?.global_fields.active ?? '—'} sub={`${stats?.global_fields.total ?? 0} total`} icon={<Database className="w-5 h-5" />} color="bg-blue-600" loading={loading} />
        <StatCard label="Portals" value={stats?.portals.active ?? '—'} sub={`${stats?.portals.total ?? 0} registered`} icon={<Globe className="w-5 h-5" />} color="bg-purple-600" loading={loading} />
        <StatCard label="Field Mappings" value={stats?.mappings.total ?? '—'} sub={stats?.mappings.low_confidence ? `${stats.mappings.low_confidence} need review` : 'all verified'} icon={<Link2 className="w-5 h-5" />} color="bg-green-600" loading={loading} />
        <StatCard label="Sessions (recent)" value={stats?.sessions.total ?? '—'} sub={stats?.sessions.avg_confidence != null ? `avg ${stats.sessions.avg_confidence}% confidence` : 'no sessions'} icon={<Activity className="w-5 h-5" />} color="bg-orange-600" loading={loading} />
      </div>

      {/* Portal Tier Breakdown */}
      {stats && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-500" />
            Automation Tier Breakdown
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(AUTOMATION_TIER_CONFIG).map(([tier, cfg]) => (
              <span key={tier} className={`px-3 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                {cfg.label}: {stats.portals.by_tier[tier] || 0}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      {stats && (stats.mappings.low_confidence > 0 || stats.mappings.unverified > 0) && (
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-200">
            <p className="font-medium">Mapping Review Needed</p>
            <p className="mt-0.5">
              {stats.mappings.low_confidence} mappings have confidence &lt;70% •{' '}
              {stats.mappings.unverified} mappings have never been verified.
              <Link href="/admin/autofill/mappings?low_confidence=true" className="ml-2 underline">Review now</Link>
            </p>
          </div>
        </div>
      )}

      {/* Nav Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {navCards.map(card => (
          <Link key={card.href} href={card.href} className="group bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex items-start gap-4 hover:border-indigo-300 hover:shadow-sm transition-all">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-100 group-hover:text-indigo-300">{card.title}</div>
              <div className="text-sm text-slate-500 mt-0.5">{card.description}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Recent Autofill Sessions</h2>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-950 border-b border-slate-800">
                <tr>
                  {['Client', 'Portal', 'Status', 'Fields Filled', 'Confidence', 'When'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentSessions.map((s: Record<string, unknown>) => {
                  const statusCfg = SESSION_STATUS_CONFIG[(s.status as string) as keyof typeof SESSION_STATUS_CONFIG];
                  return (
                    <tr key={s.id as string} className="hover:bg-slate-950">
                      <td className="px-4 py-2.5 text-slate-100">{(s.clients as { company_name?: string })?.company_name || '—'}</td>
                      <td className="px-4 py-2.5 text-slate-400">{(s.compliance_portals as { short_name?: string })?.short_name || (s.detected_portal as string) || '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg?.color}`}>{statusCfg?.label || s.status as string}</span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-200">
                        {s.fields_filled as number}/{s.fields_attempted as number}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400">
                        {s.confidence_avg != null ? `${s.confidence_avg}%` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {s.started_at ? new Date(s.started_at as string).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon, color, loading }: {
  label: string; value: number | string; sub: string;
  icon: React.ReactNode; color: string; loading: boolean;
}) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-500">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${color}`}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-slate-100">{loading ? '...' : value}</div>
      <div className="text-xs text-slate-500 mt-1">{sub}</div>
    </div>
  );
}
