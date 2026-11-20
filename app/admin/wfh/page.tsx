import { createClient } from '@supabase/supabase-js';
import WfhDashboardClient, { WfhStaff } from './WfhDashboardClient';

export const metadata = { title: 'WFH Team Dashboard' };

const WFH_ROLES = [
  'lead_gen_executive', 'appointment_setter', 'crm_data_executive', 'customer_support_executive',
  'virtual_assistant', 'proposal_executive', 'compliance_doc_executive',
  'market_research_executive', 'mis_reporting_executive',
];

async function fetchWfhData(): Promise<WfhStaff[]> {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );

  const today = new Date().toISOString().split('T')[0];

  const { data: profiles } = await db
    .from('profiles')
    .select('id, full_name, email, role, ops_training_completed')
    .in('role', WFH_ROLES)
    .order('full_name');

  if (!profiles || profiles.length === 0) return [];

  const ids = profiles.map(p => p.id);

  const [checkins, logs, tasks] = await Promise.all([
    db.from('wfh_checkins')
      .select('user_id, status, checked_in_at, checked_out_at, total_hours')
      .in('user_id', ids)
      .eq('date', today),
    db.from('wfh_daily_logs')
      .select('user_id')
      .in('user_id', ids)
      .eq('date', today),
    db.from('ops_tasks')
      .select('assigned_to')
      .in('assigned_to', ids)
      .in('status', ['pending', 'in_progress']),
  ]);

  const checkinMap = new Map((checkins.data ?? []).map(c => [c.user_id, c]));
  const logSet     = new Set((logs.data ?? []).map(l => l.user_id));
  const taskCount  = (tasks.data ?? []).reduce<Record<string, number>>((acc, t) => {
    acc[t.assigned_to] = (acc[t.assigned_to] ?? 0) + 1;
    return acc;
  }, {});

  return profiles.map(p => ({
    id:                     p.id,
    full_name:              p.full_name ?? '',
    email:                  p.email ?? '',
    role:                   p.role,
    ops_training_completed: p.ops_training_completed ?? false,
    checkin:                checkinMap.get(p.id) ?? null,
    log_today:              logSet.has(p.id),
    tasks_active:           taskCount[p.id] ?? 0,
  }));
}

export default async function WfhAdminPage() {
  const staff = await fetchWfhData();

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">WFH Team Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Live check-in status, EOD log tracking, task activity, and training progress for all remote WFH staff.
        </p>
      </div>
      <WfhDashboardClient staff={staff} />
    </div>
  );
}
