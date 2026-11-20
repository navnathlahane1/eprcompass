'use client';

import { useState, useTransition } from 'react';

const VERBS = [
  'view', 'create', 'edit', 'approve', 'publish', 'delete',
  'credentials:view_masked', 'credentials:reveal', 'connections:manage', 'users:manage',
];

const VERB_LABELS: Record<string, string> = {
  view:                    'View',
  create:                  'Create',
  edit:                    'Edit',
  approve:                 'Approve',
  publish:                 'Publish',
  delete:                  'Delete',
  'credentials:view_masked': 'Cred (masked)',
  'credentials:reveal':    'Cred (reveal)',
  'connections:manage':    'Connections',
  'users:manage':          'Users',
};

const SCOPE_LABELS: Record<string, string> = {
  global: 'Global',
  region: 'Region',
  own:    'Own accts',
};

export interface RbacRow {
  role: string;
  permission_verb: string;
  granted: boolean;
  scope: string | null;
}

interface Props {
  initialRows: RbacRow[];
  allRoles: string[];
  canEdit: boolean;
}

export default function RbacMatrix({ initialRows, allRoles, canEdit }: Props) {
  const [rows, setRows] = useState<RbacRow[]>(initialRows);
  const [isPending, startTransition] = useTransition();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  function getRow(role: string, verb: string): RbacRow | undefined {
    return rows.find(r => r.role === role && r.permission_verb === verb);
  }

  async function togglePermission(role: string, verb: string, currentGranted: boolean) {
    if (!canEdit) return;
    const key = `${role}:${verb}`;
    setSavingKey(key);
    setError('');

    const newGranted = !currentGranted;
    // Optimistic update
    setRows(prev => prev.map(r =>
      r.role === role && r.permission_verb === verb ? { ...r, granted: newGranted } : r
    ));

    try {
      const res = await fetch('/api/comms/rbac', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role, verb, granted: newGranted }),
      });
      if (!res.ok) {
        // Revert on failure
        setRows(prev => prev.map(r =>
          r.role === role && r.permission_verb === verb ? { ...r, granted: currentGranted } : r
        ));
        const d = await res.json();
        setError(d.error || 'Failed to save');
      }
    } catch {
      setRows(prev => prev.map(r =>
        r.role === role && r.permission_verb === verb ? { ...r, granted: currentGranted } : r
      ));
      setError('Network error');
    } finally {
      setSavingKey(null);
    }
  }

  const roleLabel = (role: string) =>
    role.replace(/^comms_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400">
          {error}
        </div>
      )}
      {!canEdit && (
        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-400">
          Read-only — only CMO and Admin can modify permissions.
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800/60">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800/60 bg-[#0c1022]">
              <th className="sticky left-0 z-10 bg-[#0c1022] px-4 py-3 text-left font-semibold text-slate-400 border-r border-slate-800/60 min-w-[160px]">
                Role
              </th>
              {VERBS.map(v => (
                <th key={v} className="px-3 py-3 text-center font-medium text-slate-500 whitespace-nowrap">
                  {VERB_LABELS[v]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allRoles.map((role, ri) => (
              <tr key={role} className={`border-b border-slate-800/40 ${ri % 2 === 0 ? 'bg-[#020817]' : 'bg-[#050c14]'}`}>
                <td className="sticky left-0 z-10 px-4 py-2.5 font-medium text-slate-300 border-r border-slate-800/60"
                  style={{ backgroundColor: ri % 2 === 0 ? '#020817' : '#050c14' }}>
                  {roleLabel(role)}
                </td>
                {VERBS.map(verb => {
                  const row = getRow(role, verb);
                  const granted = row?.granted ?? false;
                  const scope = row?.scope;
                  const key = `${role}:${verb}`;
                  const saving = savingKey === key;

                  return (
                    <td key={verb} className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => togglePermission(role, verb, granted)}
                        disabled={!canEdit || saving}
                        title={scope ? `${granted ? 'Granted' : 'Denied'} (${SCOPE_LABELS[scope]})` : undefined}
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-md transition-all ${
                          saving ? 'opacity-50' : canEdit ? 'hover:scale-110 cursor-pointer' : 'cursor-not-allowed'
                        } ${
                          granted
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800/60 text-slate-700 border border-slate-700/60'
                        }`}
                      >
                        {saving ? (
                          <span className="h-3 w-3 rounded-full border-2 border-slate-600 border-t-emerald-400 animate-spin inline-block" />
                        ) : granted ? (
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                      {granted && scope && scope !== 'global' && (
                        <p className="mt-0.5 text-[9px] text-amber-500/80">{SCOPE_LABELS[scope]}</p>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-slate-600">
        Changes save instantly. Scope constraints (Region, Own) are enforced server-side and cannot be changed here — contact admin.
      </p>
    </div>
  );
}
