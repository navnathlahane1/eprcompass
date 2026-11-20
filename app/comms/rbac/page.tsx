import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import { getCommsAdminClient, COMMS_ROLES } from '@/lib/comms/auth';
import { redirect } from 'next/navigation';
import RbacMatrix from '@/components/comms/RbacMatrix';

export default async function RbacPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/iam/login');

  const canEdit = user.role === 'admin' || user.role === 'comms_cmo';
  if (!canEdit) redirect('/comms/dashboard');

  const client = getCommsAdminClient();
  const { data: rows } = await client
    .from('comms_role_permissions')
    .select('role, permission_verb, granted, scope')
    .order('role');

  const allRoles = COMMS_ROLES.filter(r => r !== 'admin' && r !== 'manager') as string[];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Permissions Matrix</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Role-based access control for the Marketing Command Centre.
          {canEdit ? ' Tap any cell to toggle.' : ' Read-only view.'}
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7"/></svg>
          </span>
          Granted
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-slate-800/60 border border-slate-700/60 text-slate-700">
            <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12"/></svg>
          </span>
          Denied
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-amber-500/80">Region</span> — Regional Manager only, account region must match
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-amber-500/80">Own accts</span> — Social Media Manager only for owned accounts
        </div>
      </div>

      <RbacMatrix
        initialRows={rows ?? []}
        allRoles={allRoles}
        canEdit={canEdit}
      />

      {/* Note on admin/manager */}
      <div className="rounded-lg border border-slate-800/40 bg-[#0c1022]/60 px-4 py-3">
        <p className="text-xs text-slate-600">
          <span className="text-slate-400 font-medium">admin</span> and{' '}
          <span className="text-slate-400 font-medium">manager</span> roles inherit all comms permissions by default and are not shown in this matrix.
          Scope constraints (Region, Own) are enforced server-side and cannot be toggled here.
        </p>
      </div>
    </div>
  );
}
