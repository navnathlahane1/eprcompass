'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { daysUntil, formatDaysRemaining, getUrgency, URGENCY_CONFIG, FILING_TYPE_LABELS, TASK_STATUS_COLORS, TASK_STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/complianceKnowledge/constants';
import type { ClientCompliance, ClientComplianceTask, ComplianceDeadline, ClientComplianceFiling } from '@/lib/complianceKnowledge/types';

type DeadlineWithStatus = ComplianceDeadline & {
  days_remaining: number;
  is_overdue: boolean;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  filing: ClientComplianceFiling | null;
  compliance_id: string | null;
};

type AssignmentWithDeadlines = ClientCompliance & {
  deadlines: DeadlineWithStatus[];
};

type HubData = {
  assignments: AssignmentWithDeadlines[];
  tasks: ClientComplianceTask[];
  notifications: { id: string; title: string; message: string; notification_type: string; created_at: string; is_read: boolean }[];
  summary: {
    total_frameworks: number;
    active_tasks: number;
    overdue_tasks: number;
    upcoming_deadlines_30d: number;
    unread_notifications: number;
  };
};

export default function ComplianceHubPage() {
  const [data, setData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCountry, setActiveCountry] = useState<string>('all');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/portal/compliance-hub');
        if (!res.ok) throw new Error('Failed to load compliance data');
        const d = await res.json();
        setData(d);
        if (d.assignments?.length) {
          setActiveCountry('all');
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error loading data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading compliance hub…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!data || data.assignments.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-teal-600" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900">No Compliance Assigned Yet</h2>
        <p className="mt-2 text-sm text-slate-500">
          Your compliance manager will assign applicable frameworks to your account.<br />
          Contact your EPR manager for more information.
        </p>
      </div>
    );
  }

  const { assignments, tasks, summary } = data;

  // Get unique countries
  const countries = [...new Map(
    assignments.map(a => [
      a.compliance_frameworks?.compliance_countries?.name || 'Unknown',
      a.compliance_frameworks?.compliance_countries
    ])
  ).entries()].map(([name, country]) => ({ name, country }));

  const filtered = activeCountry === 'all'
    ? assignments
    : assignments.filter(a => a.compliance_frameworks?.compliance_countries?.name === activeCountry);

  // Upcoming deadlines across all frameworks
  const allUpcoming = assignments
    .flatMap(a => a.deadlines || [])
    .filter(d => !d.is_overdue || d.days_remaining > -30)
    .sort((a, b) => a.days_remaining - b.days_remaining)
    .slice(0, 6);

  const overdueTasks = tasks.filter(t =>
    t.due_date && daysUntil(t.due_date) < 0 && t.status !== 'completed' && t.status !== 'waived'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance Hub</h1>
          <p className="mt-1 text-sm text-slate-500">Your global compliance dashboard — deadlines, tasks, and filings.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/portal/compliance-hub/calendar" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
            Calendar View
          </Link>
          <Link href="/portal/compliance-hub/tasks" className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 transition">
            All Tasks
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <SummaryCard label="Frameworks" value={summary.total_frameworks} color="bg-white border-slate-200" textColor="text-slate-900" />
        <SummaryCard label="Active Tasks" value={summary.active_tasks} color="bg-blue-50 border-blue-200" textColor="text-blue-700" />
        <SummaryCard label="Overdue" value={summary.overdue_tasks} color={summary.overdue_tasks > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"} textColor={summary.overdue_tasks > 0 ? "text-red-700" : "text-slate-400"} />
        <SummaryCard label="Due in 30d" value={summary.upcoming_deadlines_30d} color="bg-orange-50 border-orange-200" textColor="text-orange-700" />
        <SummaryCard label="Notifications" value={summary.unread_notifications} color={summary.unread_notifications > 0 ? "bg-teal-50 border-teal-200" : "bg-white border-slate-200"} textColor={summary.unread_notifications > 0 ? "text-teal-700" : "text-slate-400"} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left: Frameworks */}
        <div className="lg:col-span-2 space-y-4">
          {/* Country tabs */}
          {countries.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCountry('all')}
                className={`rounded-full px-3 py-1 text-sm font-medium transition ${activeCountry === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All Countries
              </button>
              {countries.map(({ name, country }) => (
                <button
                  key={name}
                  onClick={() => setActiveCountry(name)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition ${activeCountry === name ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {country?.flag_emoji} {name}
                </button>
              ))}
            </div>
          )}

          {/* Framework Cards */}
          <div className="space-y-4">
            {filtered.map(assignment => (
              <FrameworkAccordion key={assignment.id} assignment={assignment} />
            ))}
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-4">
          {/* Overdue Alert */}
          {overdueTasks.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">{overdueTasks.length}</span>
                Overdue Items
              </p>
              <div className="mt-3 space-y-2">
                {overdueTasks.slice(0, 3).map(t => (
                  <div key={t.id} className="rounded-lg bg-white p-2.5 text-xs">
                    <p className="font-medium text-slate-800">{t.title}</p>
                    <p className="text-red-500">{t.due_date ? formatDaysRemaining(daysUntil(t.due_date)) : 'No date'}</p>
                  </div>
                ))}
              </div>
              <Link href="/portal/compliance-hub/tasks?status=overdue" className="mt-3 block text-center text-xs font-medium text-red-700 hover:underline">
                View all overdue →
              </Link>
            </div>
          )}

          {/* Upcoming Deadlines */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">Upcoming Deadlines</p>
              <Link href="/portal/compliance-hub/calendar" className="text-xs text-teal-600 hover:underline">Calendar →</Link>
            </div>
            {allUpcoming.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No upcoming deadlines in next 90 days.</p>
            ) : (
              <div className="space-y-2.5">
                {allUpcoming.map(d => {
                  const uc = URGENCY_CONFIG[d.urgency];
                  const filed = ['submitted', 'approved'].includes(d.filing?.status || '');
                  return (
                    <div key={d.id} className={`rounded-lg border p-2.5 ${filed ? 'opacity-50' : uc.color}`}>
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-800 truncate">{d.title}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {d.compliance_frameworks?.compliance_countries?.flag_emoji}{' '}
                            {d.compliance_frameworks?.short_name}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`text-[10px] font-semibold ${d.is_overdue ? 'text-red-600' : ''}`}>
                            {formatDaysRemaining(d.days_remaining)}
                          </p>
                          {filed && <span className="text-[10px] text-green-600">Filed</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Tasks */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">My Tasks</p>
              <Link href="/portal/compliance-hub/tasks" className="text-xs text-teal-600 hover:underline">All tasks →</Link>
            </div>
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No active tasks.</p>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2">
                    <div className={`h-2 w-2 shrink-0 rounded-full ${URGENCY_CONFIG[getUrgency(t.due_date ? daysUntil(t.due_date) : 999)].dotColor}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-800">{t.title}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${TASK_STATUS_COLORS[t.status]}`}>
                      {TASK_STATUS_LABELS[t.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, textColor }: { label: string; value: number; color: string; textColor: string }) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function FrameworkAccordion({ assignment }: { assignment: AssignmentWithDeadlines }) {
  const [open, setOpen] = useState(true);
  const fw = assignment.compliance_frameworks;
  if (!fw) return null;

  const upcomingCount = (assignment.deadlines || []).filter(d => !d.is_overdue && d.days_remaining >= 0).length;
  const overdueCount = (assignment.deadlines || []).filter(d => d.is_overdue).length;
  const filedCount = (assignment.deadlines || []).filter(d => ['submitted','approved'].includes(d.filing?.status || '')).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{fw.compliance_countries?.flag_emoji}</span>
          <div>
            <p className="font-semibold text-slate-900">{fw.short_name || fw.name}</p>
            <p className="text-xs text-slate-500">
              {fw.compliance_countries?.name} · {fw.compliance_types?.name}
              {fw.regulatory_authorities?.acronym && ` · ${fw.regulatory_authorities.acronym}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {overdueCount > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">{overdueCount} overdue</span>
          )}
          {upcomingCount > 0 && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">{upcomingCount} upcoming</span>
          )}
          {filedCount > 0 && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{filedCount} filed</span>
          )}
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-4">
          {/* Registration Info */}
          {(assignment.entity_type || assignment.registration_no) && (
            <div className="mt-3 flex gap-4 text-xs text-slate-500">
              {assignment.entity_type && <span>Entity: <strong>{assignment.entity_type}</strong></span>}
              {assignment.registration_no && <span>Reg No: <strong className="text-teal-700">{assignment.registration_no}</strong></span>}
            </div>
          )}

          {/* Filing Notes */}
          {fw.filing_notes && (
            <div className="mt-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
              {fw.filing_notes}
            </div>
          )}

          {/* Deadlines */}
          {assignment.deadlines?.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Deadlines</p>
              {assignment.deadlines.map(d => {
                const uc = URGENCY_CONFIG[d.urgency];
                const filed = ['submitted', 'approved'].includes(d.filing?.status || '');
                return (
                  <div key={d.id} className={`flex items-center justify-between rounded-lg border p-3 ${filed ? 'border-green-100 bg-green-50' : uc.color}`}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{d.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {FILING_TYPE_LABELS[d.filing_type] || d.filing_type}
                        {d.financial_year_structures && ` · ${d.financial_year_structures.short_label}`}
                      </p>
                    </div>
                    <div className="shrink-0 ml-3 text-right">
                      <p className={`text-xs font-semibold ${d.is_overdue ? 'text-red-600' : ''}`}>
                        {formatDaysRemaining(d.days_remaining)}
                      </p>
                      <p className="text-[10px] text-slate-400">{new Date(d.due_date).toLocaleDateString()}</p>
                      {filed && (
                        <span className="text-[10px] font-medium text-green-600">
                          {d.filing?.status === 'approved' ? 'Approved' : 'Submitted'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-400 text-center py-2">No upcoming deadlines in next 90 days.</p>
          )}

          {/* Links */}
          <div className="mt-4 flex gap-3">
            {fw.portal_url && (
              <a
                href={fw.portal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-teal-600 hover:underline"
              >
                Open Compliance Portal ↗
              </a>
            )}
            <Link
              href={`/portal/compliance-hub/tasks?compliance_id=${assignment.id}`}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline"
            >
              View Tasks →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
