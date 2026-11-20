import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import EprDashboardClient from './EprDashboardClient';

export const metadata = { title: 'EPR Unified Dashboard | EPR Compass' };

function isSuperAdmin(email?: string | null) {
  return String(process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
    .includes(String(email || '').trim().toLowerCase());
}

export default async function EprUnifiedDashboardPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?returnUrl=/admin/epr-unified-dashboard');

  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role: string = profile?.role ?? 'viewer';
  const isAdmin = ['admin', 'manager'].includes(role) || isSuperAdmin(user.email);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">
          Multi-EPR Unified Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Aggregate compliance view across Plastic, E-Waste, Battery, Used Oil, and Tyre EPR categories.
        </p>
      </div>

      <EprDashboardClient isAdmin={isAdmin} role={role} />
    </div>
  );
}

