import SimpleLoginForm from '@/components/auth/SimpleLoginForm';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'EPR Academy – Sign In | EPR Compass' };

export default async function AcademyLoginPage({ searchParams }: { searchParams: Promise<{ program?: string }> }) {
  const { program } = await searchParams;
  const programs: Record<string, string> = { 'tier-1': 'EPR Awareness Bootcamp', 'tier-2': 'Certified EPR Professional (CEPC)', 'tier-3': 'EPR Agency Leadership Programme' };
  const selected = program && programs[program] ? program : '';
  return (
    <>
    <section className="border-b border-emerald-200 bg-emerald-50 px-6 py-6 text-emerald-950">
      <h1 className="text-lg font-semibold">{selected ? `Enrol in ${programs[selected]}` : 'New to EPR Academy?'}</h1>
      <p className="mt-2 text-sm">Academy access is provided after enrolment approval. Request access from our team; creating a general EPR Compass account does not automatically enrol you in a training programme.</p>
      <Link href={`/contact?intent=academy${selected ? `&program=${selected}` : ''}`} className="mt-3 inline-block rounded-lg bg-emerald-800 px-4 py-3 text-sm font-semibold text-white">Request {selected ? programs[selected] : 'Academy'} access</Link>
      <Link href="/trainings" className="ml-5 inline-block text-sm font-semibold underline">View training programmes</Link>
    </section>
    <SimpleLoginForm
      title="EPR Academy"
      subtitle="Training, certification, and EPR awareness management platform for compliance-driven learning."
      dashboardPath="/academy/dashboard"
      requiredRole={['academy_director', 'academy_manager', 'training_program_manager', 'trainer', 'guest_trainer', 'partner_trainer', 'learner', 'admin']}
      accent="indigo"
      portal="academy"
      showPortalSwitcher={false}
      showHelpLink={false}
      footerNote="Academy team access only"
      features={[
        'Manage EPR awareness training programs',
        'Issue compliance certificates digitally',
        'Track stakeholder training coverage',
        'Generate compliance evidence for audits',
      ]}
    />
    </>
  );
}

