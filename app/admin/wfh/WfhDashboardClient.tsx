'use client';

import { useState } from 'react';

export interface WfhStaff {
  id: string;
  full_name: string;
  email: string;
  role: string;
  ops_training_completed: boolean;
  checkin?: {
    status: string;
    checked_in_at?: string;
    checked_out_at?: string;
    total_hours?: number;
  } | null;
  log_today?: boolean;
  tasks_active: number;
}

const DEPT_MAP: Record<string, string> = {
  lead_gen_executive:         'Business & Sales',
  appointment_setter:         'Business & Sales',
  crm_data_executive:         'Business & Sales',
  customer_support_executive: 'Business & Sales',
  virtual_assistant:          'Operations',
  proposal_executive:         'Operations',
  compliance_doc_executive:   'Operations',
  market_research_executive:  'Operations',
  mis_reporting_executive:    'Operations',
};

const ROLE_LABELS: Record<string, string> = {
  lead_gen_executive:         'Lead Gen',
  appointment_setter:         'Appt Setter',
  crm_data_executive:         'CRM Data',
  customer_support_executive: 'Support',
  virtual_assistant:          'VA',
  proposal_executive:         'Proposals',
  compliance_doc_executive:   'Compliance Docs',
  market_research_executive:  'Market Research',
  mis_reporting_executive:    'MIS & Reports',
};

function checkinBadge(checkin?: WfhStaff['checkin']) {
  if (!checkin || checkin.status === 'pending' || checkin.status === 'absent') {
    return <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-slate-700/50 text-slate-500">Absent</span>;
  }
  if (checkin.status === 'active') {
    const t = checkin.checked_in_at ? new Date(checkin.checked_in_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
    return <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-green-500/15 text-green-400">In {t && `· ${t}`}</span>;
  }
  if (checkin.status === 'completed') {
    return <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-teal-500/15 text-teal-400">{checkin.total_hours?.toFixed(1) ?? '?'} hrs</span>;
  }
  return null;
}

export default function WfhDashboardClient({ staff }: { staff: WfhStaff[] }) {
  const [dept, setDept]   = useState<'all' | 'Business & Sales' | 'Operations'>('all');
  const [status, setStatus] = useState<'all' | 'in' | 'out'>('all');

  const filtered = staff.filter(s => {
    if (dept !== 'all' && DEPT_MAP[s.role] !== dept) return false;
    if (status === 'in'  && s.checkin?.status !== 'active')    return false;
    if (status === 'out' && s.checkin?.status === 'active')    return false;
    return true;
  });

  const presentCount  = staff.filter(s => s.checkin?.status === 'active' || s.checkin?.status === 'completed').length;
  const loggedCount   = staff.filter(s => s.log_today).length;
  const trainedCount  = staff.filter(s => s.ops_training_completed).length;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total WFH Staff', value: staff.length, color: 'text-slate-200' },
          { label: 'Checked In Today', value: presentCount, color: 'text-green-400' },
          { label: 'EOD Log Submitted', value: loggedCount, color: 'text-teal-400' },
          { label: 'Training Complete', value: trainedCount, color: 'text-indigo-400' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
            <p className="text-xs text-slate-500 mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex rounded-lg border border-slate-800/60 overflow-hidden text-sm">
          {(['all', 'Business & Sales', 'Operations'] as const).map(d => (
            <button key={d} onClick={() => setDept(d)}
              className={`px-3 py-1.5 transition ${dept === d ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}>
              {d === 'all' ? 'All Depts' : d}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-slate-800/60 overflow-hidden text-sm">
          {(['all', 'in', 'out'] as const).map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 transition ${status === s ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}>
              {s === 'all' ? 'All Status' : s === 'in' ? 'Checked In' : 'Absent'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700/60 p-12 text-center">
          <p className="text-slate-500 text-sm">No staff match the selected filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/80">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Dept</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Today</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">EOD Log</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tasks</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Training</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-200">{s.full_name || 'Unnamed'}</p>
                    <p className="text-xs text-slate-600">{s.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{ROLE_LABELS[s.role] ?? s.role}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{DEPT_MAP[s.role] ?? '—'}</td>
                  <td className="px-4 py-3">{checkinBadge(s.checkin)}</td>
                  <td className="px-4 py-3">
                    {s.log_today
                      ? <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-teal-500/15 text-teal-400">Submitted</span>
                      : <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-slate-700/50 text-slate-500">Pending</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-slate-400">{s.tasks_active > 0 ? `${s.tasks_active} active` : '—'}</td>
                  <td className="px-4 py-3">
                    {s.ops_training_completed
                      ? <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-green-500/15 text-green-400">Done</span>
                      : <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500/15 text-amber-400">Pending</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
