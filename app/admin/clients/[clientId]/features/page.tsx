import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';
import { ClientFeatureFlagsClient } from './ClientFeatureFlagsClient';
import Link from 'next/link';
import { ChevronLeft, Settings2 } from 'lucide-react';

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function ClientFeaturesPage({ params }: Props) {
  const { clientId } = await params;

  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const isAdmin = isSuperAdmin(user.email) || (() => {
    // Role check handled by admin layout — this is defence in depth
    return false;
  })();

  if (!isSuperAdmin(user.email)) {
    redirect('/admin');
  }

  // Fetch client info for display
  const { createClient } = await import('@supabase/supabase-js');
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: profile } = await db
    .from('profiles')
    .select('full_name, email, company_name')
    .eq('id', clientId)
    .maybeSingle() as any;

  const displayName = profile?.company_name || profile?.full_name || profile?.email || clientId;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Breadcrumb */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-100"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Admin
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-eco-green-5/10 text-eco-green-5">
          <Settings2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Feature Flags</h1>
          <p className="text-sm text-slate-500">{displayName}</p>
        </div>
      </div>

      <p className="text-sm text-amber-300 bg-amber-950/40 rounded-lg px-4 py-2 border border-amber-700/50">
        Changes take effect immediately. No deployment required.
      </p>

      {/* Feature toggles */}
      <ClientFeatureFlagsClient clientId={clientId} />
    </div>
  );
}
