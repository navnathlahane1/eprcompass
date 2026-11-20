import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import ReferralsClient from './ReferralsClient';

export const metadata = { title: 'Referrals | Partner Portal' };

export default async function PartnerReferralsPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const { data: partner } = await (supabase as any)
    .from('partners').select('id').eq('profile_id', user.id).maybeSingle();

  if (!partner) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm text-slate-600">Partner profile not linked. Contact support.</p>
        </div>
      </div>
    );
  }

  let referralData: { code: string; url: string; clicks: number; conversions: number } | null = null;

  try {
    const { data } = await (supabase as any)
      .from('partner_referral_codes')
      .select('code, url_slug, clicks, conversions')
      .eq('partner_id', partner.id)
      .maybeSingle();

    if (data) {
      const slug = data.url_slug || data.code;
      referralData = {
        code: data.code,
        url: `http://localhost:3000/ref/${slug}`,
        clicks: Number(data.clicks || 0),
        conversions: Number(data.conversions || 0),
      };
    }
  } catch {
    // Table may not exist — graceful fallback
    referralData = null;
  }

  return <ReferralsClient referral={referralData} />;
}
