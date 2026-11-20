import { redirect } from 'next/navigation';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import TeamLeadDashboardClient from './TeamLeadDashboardClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Team Dashboard | Telecalling' };

const TEAM_LEAD_ROLES = ['tc_team_lead', 'admin', 'manager'];

export default async function TeamLeadDashboardPage() {
  const actor = await resolveActor();
  if (!actor) redirect('/telecalling/login');
  if (!TEAM_LEAD_ROLES.includes(actor.role)) redirect('/telecalling/dashboard');

  return <TeamLeadDashboardClient />;
}
