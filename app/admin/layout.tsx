import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { cookies, headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import AdminSidebar from '../../components/layout/AdminSidebar';
import AdminTopBar from '../../components/layout/AdminTopBar';
import AdminContent from '../../components/layout/AdminContent';
import AdminChatBot from '../../components/admin/AdminChatBot';
import { AdminToastWrapper } from '../../components/admin/AdminToastWrapper';
import InboxBanners from '../../components/inbox/InboxBanners';
import { createServerComponentClient } from '../../lib/supabase/createServerComponentClient';
import AdminModuleAccessGate from '../../components/layout/AdminModuleAccessGate';
import { isSuperAdmin as isConfiguredSuperAdmin, effectiveAdminRole } from '../../lib/admin/isSuperAdmin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';

  // Login page is under this layout but must not be auth-gated (would redirect-loop)
  if (pathname === '/admin/login' || pathname === '/admin/change-password') {
    return <>{children}</>;
  }

  const cookieStore = await cookies();
  const isDevBypassEnabled =
    process.env.NODE_ENV !== 'production' &&
    cookieStore.get('dev-admin-bypass')?.value === '1';

  if (isDevBypassEnabled) {
    return (
      <AdminToastWrapper>
        <div className="flex h-dvh overflow-hidden bg-zinc-50 text-zinc-900">
          <Suspense><AdminSidebar unreadCount={0} /></Suspense>
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <AdminTopBar unreadCount={0} userRole="Local preview" />
            <AdminContent>
              <AdminModuleAccessGate>
                {children}
              </AdminModuleAccessGate>
            </AdminContent>
          </div>
        </div>
      </AdminToastWrapper>
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const hasValidSupabaseUrl =
    Boolean(supabaseUrl) && !String(supabaseUrl).includes('example.supabase.co');
  const hasAnyUsableKey = Boolean(serviceRoleKey || supabaseAnonKey);

  if (!hasValidSupabaseUrl || !hasAnyUsableKey) {
    redirect('/admin/login');
  }

  // Extract access token from cookies (supports both custom and Supabase v2 native cookie names)
  const accessCookie = cookieStore
    .getAll()
    .find(
      (c) =>
        c.name.endsWith('-access-token') ||
        c.name === 'sb-access-token' ||
        c.name.endsWith('-auth-token')
    );

  function tryParseToken(raw?: string): string | undefined {
    if (!raw) return undefined;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string') return parsed;
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0];
      if (parsed?.access_token) return parsed.access_token;
    } catch {}
    return raw;
  }

  const accessToken = tryParseToken(accessCookie?.value);
  if (!accessToken) redirect('/admin/login');

  // Use service role client so auth validation and profiles query bypass RLS entirely.
  const adminClient = createClient(
    supabaseUrl!,
    serviceRoleKey ?? supabaseAnonKey!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );

  let user: { id: string; email?: string | null } | null = null;
  try {
    const { data: { user: authUser }, error: authError } = await adminClient.auth.getUser(accessToken!);
    if (authError || !authUser) redirect('/admin/login');
    user = authUser;
  } catch {
    redirect('/admin/login');
  }

  if (!user) redirect('/admin/login');

  // Also create the anon-key scoped client for data queries within child pages
  let supabase: any;
  try {
    supabase = await createServerComponentClient();
  } catch {
    redirect('/admin/login');
  }

  let profile: any = null;
  try {
    const { data } = await adminClient
      .from('profiles')
      .select('role, force_password_change')
      .eq('id', user.id)
      .maybeSingle();
    profile = data;
  } catch {
    // profile remains null; role check below will handle super-admins
  }

  const effectiveRole = effectiveAdminRole(profile?.role, user.email);

  if (!['admin', 'manager', 'sales-executive', 'epr-executive', 'operator', 'hr-executive', 'training-executive'].includes(effectiveRole)) {
    redirect('/admin/login');
  }

  if (!isConfiguredSuperAdmin(user.email) && profile?.force_password_change) {
    redirect('/admin/change-password');
  }

  let unreadCount = 0;
  try {
    const { count } = await (supabase as any)
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .eq('read', false);

    unreadCount = Number(count || 0);
  } catch {
    unreadCount = 0;
  }

  return (
    <AdminToastWrapper>
      <div className="flex h-dvh overflow-hidden bg-zinc-50 text-zinc-900">
        <a href="#admin-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:p-3 focus:text-emerald-800">Skip to content</a>
        {/* Sidebar */}
        <Suspense><AdminSidebar unreadCount={unreadCount} /></Suspense>

        {/* Right column: top bar + scrollable content */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <AdminTopBar unreadCount={unreadCount} userEmail={user.email} userRole={effectiveRole} />

          {/* Inbox banners (client component — dismissible per-user) */}
          <InboxBanners />

          <AdminContent>
            <AdminModuleAccessGate>
                {children}
            </AdminModuleAccessGate>
          </AdminContent>
        </div>

        {/* Floating Claude AI chatbot — admin only */}
        <AdminChatBot />
      </div>
    </AdminToastWrapper>
  );
}
