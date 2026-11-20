import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import { CopyableCode } from '@/components/eco/CopyableCode';
import { ProfileEditSection, MessageRMSection } from './ProfileEditClient';
import TourTarget from '@/components/portal/tour/TourTarget';

export const metadata = { title: 'My Profile | Partner Portal' };

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">{value || '—'}</p>
    </div>
  );
}

function formatDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function PartnerProfilePage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const { data: partner } = await (supabase as any)
    .from('partners')
    .select(`
      id, company_name, partner_type, partner_tier, partner_status,
      persona_label, state, city, contact_person, email, phone,
      outreach_tier, stage, commission_type, commission_value,
      contract_date, contract_renewal_date, agreement_signed,
      nda_signed, non_compete_expires,
      kit_sent, training_completed, portal_access, assigned_rm,
      address_line1, address_line2, pincode, full_address,
      years_in_business, no_of_employees_range
    `)
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!partner) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm text-slate-600">Partner profile not linked. Contact support.</p>
        </div>
      </div>
    );
  }

  const { data: manager } = partner.assigned_rm
    ? await (supabase as any).from('profiles').select('full_name, email').eq('id', partner.assigned_rm).maybeSingle()
    : { data: null };

  const commissionText = partner.commission_type
    ? `${partner.commission_type}${partner.commission_value
        ? ` — ${partner.commission_type === 'Revenue Share' ? `${partner.commission_value}%` : `₹${Number(partner.commission_value).toLocaleString('en-IN')}`}`
        : ''}`
    : null;

  const TIER_NAMES: Record<number, string> = {
    1: 'Direct Sales Power', 2: 'Trusted Advisors', 3: 'Networked Influencers',
    4: 'Regional Specialists', 5: 'Emerging/Digital',
  };
  const STATUS_STYLE: Record<string, string> = {
    Probationary: 'bg-amber-100 text-amber-800',
    Active:       'bg-emerald-100 text-emerald-800',
    Senior:       'bg-indigo-100 text-indigo-800',
  };

  const readiness = [
    { label: 'NDA Signed',           done: !!partner.nda_signed },
    { label: 'Agreement Signed',     done: !!partner.agreement_signed },
    { label: 'Welcome Kit Sent',     done: !!partner.kit_sent },
    { label: 'Training Completed',   done: !!partner.training_completed },
    { label: 'Portal Access',        done: !!partner.portal_access },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">My Profile</h1>
          <p className="text-sm text-slate-500">Your partner account details.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {partner.partner_tier && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              Tier {partner.partner_tier} — {TIER_NAMES[partner.partner_tier]}
            </span>
          )}
          {partner.partner_status && (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[partner.partner_status] || 'bg-slate-100 text-slate-700'}`}>
              {partner.partner_status}
            </span>
          )}
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            {partner.partner_type || 'Partner'}
          </span>
        </div>
      </div>

      {/* Identity */}
      <TourTarget id="profile-identity" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Company & Contact</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Company Name" value={partner.company_name} />
          </div>
          <Field label="Contact Person" value={partner.contact_person} />
          <Field label="Phone" value={partner.phone} />
          <Field label="Email" value={partner.email} />
          <Field label="Location" value={[partner.city, partner.state].filter(Boolean).join(', ')} />
          {partner.full_address && (
            <div className="sm:col-span-2">
              <Field label="Full Address" value={partner.full_address} />
            </div>
          )}
          {partner.years_in_business && <Field label="Years in Business" value={String(partner.years_in_business)} />}
          {partner.no_of_employees_range && <Field label="Team Size" value={partner.no_of_employees_range} />}
        </div>
      </TourTarget>

      {/* Partnership */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Partnership Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Partner Type" value={partner.partner_type} />
          {partner.persona_label && <Field label="Persona" value={partner.persona_label} />}
          <Field label="Commission Structure" value={commissionText} />
          <Field label="Contract Date" value={formatDate(partner.contract_date)} />
          <Field label="Contract Renewal" value={formatDate(partner.contract_renewal_date)} />
          {partner.non_compete_expires && <Field label="Non-Compete Expires" value={formatDate(partner.non_compete_expires)} />}
          <Field label="Relationship Manager" value={manager?.full_name} />
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Partner ID</p>
            <div className="mt-1">
              <CopyableCode value={partner.id} label="Partner ID" />
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding status */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Onboarding Status</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {readiness.map((r) => (
            <div
              key={r.label}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${r.done ? 'bg-emerald-50' : 'bg-slate-50'}`}
            >
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${r.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}>
                {r.done && (
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-xs ${r.done ? 'text-emerald-800 font-medium' : 'text-slate-600'}`}>{r.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Profile Section */}
      <TourTarget id="profile-edit-action">
        <ProfileEditSection
          initial={{
            phone: partner.phone || '',
            city: partner.city || '',
            state: partner.state || '',
            address_line1: partner.address_line1 || '',
            address_line2: partner.address_line2 || '',
            pincode: partner.pincode || '',
          }}
        />
      </TourTarget>

      {/* Message RM */}
      <TourTarget id="profile-message-rm">
        <MessageRMSection rmProfileId={partner.assigned_rm || null} />
      </TourTarget>

      <p className="text-xs text-slate-400">
        For other changes contact your relationship manager or email{' '}
        <a href="mailto:supporteprcompass@gmail.com" className="font-medium text-indigo-600 hover:underline">supporteprcompass@gmail.com</a>
      </p>
    </div>
  );
}
