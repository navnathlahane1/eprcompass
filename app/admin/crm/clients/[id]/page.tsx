import Link from 'next/link';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { createChecklist } from '@/lib/onboarding/templates';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
import EditClientForm from './EditClientForm';
import AccountManagementPanel from '@/components/admin/AccountManagementPanel';
import LinkPortalUserPanel from '@/components/admin/LinkPortalUserPanel';
import LinkIntelCompanyPanel from '@/components/admin/LinkIntelCompanyPanel';

const TaskWidget = dynamic(() => import('@/components/tasks/TaskWidget'));

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  const { data: client } = await (supabase as any)
    .from('clients')
    .select('id, profile_id, category, waste_categories, status, assigned_manager_id, onboarded_date, renewal_date, ltv_inr, notes, intel_company_id')
    .eq('id', id)
    .maybeSingle();

  if (!client) return notFound();

  const [{ data: profile }, { data: manager }, { data: managers }, { data: intelCompany }] = await Promise.all([
    client.profile_id
      ? (supabase as any)
          .from('profiles')
          .select('id, full_name, company_name, email, phone, gstin, state')
          .eq('id', client.profile_id)
          .maybeSingle()
      : { data: null },
    client.assigned_manager_id
      ? (supabase as any)
          .from('profiles')
          .select('id, full_name')
          .eq('id', client.assigned_manager_id)
          .maybeSingle()
      : { data: null },
    (supabase as any)
      .from('profiles')
      .select('id, full_name')
      .in('role', ['admin', 'manager'])
      .order('full_name', { ascending: true }),
    client.intel_company_id
      ? (supabase as any)
          .from('intel_companies')
          .select('id, canonical_name, gstin, state, company_type')
          .eq('id', client.intel_company_id)
          .maybeSingle()
      : { data: null },
  ]);

  // Fetch auth user data (email, ban status, last_sign_in) using service role key
  let authUser: { email?: string; banned_until?: string | null; last_sign_in_at?: string | null } | null = null;
  if (client.profile_id) {
    try {
      const adminDb = makeServiceClient();
      const { data: authData } = await adminDb.auth.admin.getUserById(client.profile_id);
      authUser = authData?.user ?? null;
    } catch {
      // non-fatal — account management panel handles missing auth user gracefully
    }
  }

  // Build the linked portal user object for LinkPortalUserPanel
  const linkedPortalUser = client.profile_id
    ? {
        id: client.profile_id,
        full_name: profile?.full_name ?? null,
        company_name: profile?.company_name ?? null,
        email: authUser?.email ?? profile?.email ?? null,
        phone: profile?.phone ?? null,
        last_sign_in_at: authUser?.last_sign_in_at ?? null,
      }
    : null;

  const isBanned =
    !!authUser?.banned_until && new Date(authUser.banned_until) > new Date();

  const checklistId = await createChecklist('client', client.id);
  const { data: checklist } = await (supabase as any)
    .from('onboarding_checklists')
    .select('id, entity_type, entity_id, template_name, steps, completion_pct, created_at, updated_at')
    .eq('id', checklistId)
    .maybeSingle();

  return (
    <div className="space-y-4 max-w-5xl">
      {/* ── Page header ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="admin-page-title">{profile?.company_name || profile?.full_name || 'Client'}</h1>
          <p className="admin-page-subtitle">Category: {client.category} · Status: {client.status}</p>
        </div>
        <Link href="/admin/crm/clients" className="btn-secondary text-sm">
          ← Clients
        </Link>
      </div>

      {/* ── Profile info card (reference-style two-column) ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Personal / Contact */}
        <section className="admin-card">
          <div className="admin-card-header">Contact Information</div>
          <div className="admin-card-body grid grid-cols-2 gap-x-6 gap-y-4">
            <div><span className="admin-field-label">Contact Name</span><span className="admin-field-value">{profile?.full_name || '—'}</span></div>
            <div><span className="admin-field-label">Company</span><span className="admin-field-value">{profile?.company_name || '—'}</span></div>
            <div><span className="admin-field-label">Email</span><span className="admin-field-value break-all">{profile?.email || authUser?.email || '—'}</span></div>
            <div><span className="admin-field-label">Phone</span><span className="admin-field-value">{profile?.phone || '—'}</span></div>
            <div><span className="admin-field-label">State</span><span className="admin-field-value">{profile?.state || '—'}</span></div>
            <div><span className="admin-field-label">GSTIN</span><span className="admin-field-value font-mono text-xs">{profile?.gstin || '—'}</span></div>
          </div>
        </section>

        {/* Compliance profile */}
        <section className="admin-card">
          <div className="admin-card-header">Compliance Profile</div>
          <div className="admin-card-body grid grid-cols-2 gap-x-6 gap-y-4">
            <div><span className="admin-field-label">Category</span><span className="admin-field-value">{client.category}</span></div>
            <div>
              <span className="admin-field-label">Status</span>
              <span className={
                client.status === 'Active' ? 'badge-active' :
                client.status === 'Churned' ? 'badge-churned' :
                client.status === 'At Risk' ? 'badge-pending' : 'badge-info'
              }>{client.status}</span>
            </div>
            <div><span className="admin-field-label">Manager</span><span className="admin-field-value">{manager?.full_name || '—'}</span></div>
            <div><span className="admin-field-label">LTV (INR)</span><span className="admin-field-value">₹{Number(client.ltv_inr || 0).toLocaleString('en-IN')}</span></div>
            <div><span className="admin-field-label">Onboarded</span><span className="admin-field-value">{client.onboarded_date || '—'}</span></div>
            <div><span className="admin-field-label">Renewal</span><span className="admin-field-value">{client.renewal_date || '—'}</span></div>
            {(client.waste_categories?.length > 0) && (
              <div className="col-span-2">
                <span className="admin-field-label">Waste Categories</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {client.waste_categories.map((w: string) => (
                    <span key={w} className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">{w}</span>
                  ))}
                </div>
              </div>
            )}
            {client.notes && (
              <div className="col-span-2">
                <span className="admin-field-label">Notes</span>
                <p className="admin-field-value text-sm text-slate-400">{client.notes}</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Edit Client (collapsible inline form) */}
      <EditClientForm
        clientId={client.id}
        initial={{
          full_name: profile?.full_name ?? null,
          company_name: profile?.company_name ?? null,
          phone: profile?.phone ?? null,
          gstin: profile?.gstin ?? null,
          state: profile?.state ?? null,
          category: client.category,
          status: client.status,
          waste_categories: client.waste_categories || [],
          assigned_manager_id: client.assigned_manager_id ?? null,
          notes: client.notes ?? null,
          renewal_date: client.renewal_date ?? null,
          onboarded_date: client.onboarded_date ?? null,
        }}
        managers={managers || []}
      />

      {/* Portal Access — link a portal login user to this company */}
      <LinkPortalUserPanel clientId={client.id} linkedUser={linkedPortalUser} />

      {/* Intel Company Link — connects client to Intel panel for contact sync */}
      <LinkIntelCompanyPanel clientId={client.id} current={intelCompany ?? null} />

      {/* Account Management */}
      {authUser ? (
        <AccountManagementPanel
          clientId={client.id}
          authUserId={client.profile_id}
          email={authUser.email || profile?.email || ''}
          isBanned={isBanned}
          lastSignIn={authUser.last_sign_in_at ?? null}
        />
      ) : (
        <section className="admin-card">
          <div className="admin-card-header">Account Management</div>
          <div className="admin-card-body">
            <p className="text-sm text-slate-500">
              No Supabase Auth account found for this client. This client cannot log in yet.
            </p>
          </div>
        </section>
      )}

      {/* Tasks */}
      <Suspense fallback={<div className="admin-card p-4 text-sm text-slate-500">Loading tasks...</div>}>
        <TaskWidget entityType="client" entityId={client.id} />
      </Suspense>

      {/* Onboarding checklist */}
      {checklist ? <OnboardingChecklist checklistId={checklist.id} initialChecklist={checklist} /> : null}
    </div>
  );
}
