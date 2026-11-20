import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import { getCommsAdminClient } from '@/lib/comms/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import BrandVoiceEditor from '@/components/comms/BrandVoiceEditor';

export default async function BrandVoicePage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/iam/login');

  const canEdit = ['admin', 'comms_cmo', 'comms_brand_manager'].includes(user.role);

  const client = getCommsAdminClient();
  const { data } = await client
    .from('comms_brand_voice')
    .select('*')
    .eq('brand_entity', 'ecovijay_growth')
    .maybeSingle();

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/comms/studio" className="text-slate-500 hover:text-slate-200 transition">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6"/></svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Brand Voice</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tone, pillars, guardrails, and hashtags injected into every AI prompt
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-400/80">
        These settings are injected verbatim into Claude's system prompt for every strategy and content generation request. Changes take effect immediately on the next generation.
      </div>

      <BrandVoiceEditor initialData={data} canEdit={canEdit} />
    </div>
  );
}
