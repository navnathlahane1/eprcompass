import { redirect } from 'next/navigation';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import AnalyticsClient from './AnalyticsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Team Analytics | Telecalling' };

export default async function TeamAnalyticsPage() {
  const actor = await resolveActor();
  if (!actor) redirect('/telecalling/login');
  if (!['tc_team_lead', 'admin', 'manager'].includes(actor.role)) redirect('/telecalling/dashboard');
  return <AnalyticsClient />;
}
