import type { Metadata } from 'next';
import SimpleLoginForm from '@/components/auth/SimpleLoginForm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Market Intelligence Login | EPR Compass'
};

export default async function IntelLoginPage({ searchParams }: { searchParams: Promise<{ intelError?: string }> }) {
  const { intelError } = await searchParams;
  return (
    <>
    {intelError && <section role="alert" className="border-b border-amber-200 bg-amber-50 px-6 py-5 text-amber-950">
      <h1 className="font-semibold">{intelError === 'denied' ? 'Intel access denied' : 'Intel access is temporarily unavailable'}</h1>
      <p className="mt-1 text-sm">{intelError === 'denied' ? 'This account does not have Intel access. Ask your administrator to grant access, or sign in below with an authorized account.' : 'Please try again later or contact your administrator.'}</p>
      <div className="mt-3 flex gap-5 text-sm font-semibold"><Link href="/dashboard">Go to my dashboard</Link><Link href="/login">Main sign in</Link></div>
    </section>}
    <SimpleLoginForm
      title="EPR Market Intelligence"
      subtitle="Restricted workspace for ingestion review, schema governance, company intelligence, and licensed exports."
      dashboardPath="/intel"
      sessionCheckPath="/api/intel/session"
      accent="teal"
      features={[
        'Review new notices, filings, and company activity signals',
        'Approve discovered fields before they affect the schema',
        'Audit extracted entities, mappings, and source runs',
        'Export licensed intelligence datasets for downstream teams',
      ]}
      showPortalSwitcher={false}
      showForgotPassword={false}
      showHelpLink={false}
      footerNote="Authorized Intel users only"
      skipAutoRedirect
    />
    </>
  );
}

