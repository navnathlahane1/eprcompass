import { redirect } from 'next/navigation';
import { resolveOpsActor, getOpsAdminClient } from '@/lib/ops/auth';
import DashboardClient from './DashboardClient';

export const metadata = { title: 'Dashboard — Operations Portal' };

export default async function OpsDashboardPage() {
  const actor = await resolveOpsActor();
  if (!actor) redirect('/ops/login');

  const db = getOpsAdminClient();
  const today = new Date().toISOString().split('T')[0];

  const [checkinRes, taskRes, logRes, profileRes] = await Promise.all([
    db.from('wfh_checkins').select('status,checked_in_at,checked_out_at,total_hours')
      .eq('user_id', actor.id).eq('date', today).maybeSingle(),
    db.from('ops_tasks').select('id,status').eq('assigned_to', actor.id)
      .in('status', ['pending', 'in_progress']),
    db.from('wfh_daily_logs').select('id').eq('user_id', actor.id).eq('date', today).maybeSingle(),
    db.from('profiles').select('ops_training_completed').eq('id', actor.id).maybeSingle(),
  ]);

  return (
    <DashboardClient
      userName={actor.fullName || actor.email}
      userRole={actor.role}
      checkin={checkinRes.data ?? null}
      activeTasks={(taskRes.data ?? []).length}
      eodSubmitted={!!logRes.data}
      trainingComplete={profileRes.data?.ops_training_completed ?? false}
    />
  );
}
