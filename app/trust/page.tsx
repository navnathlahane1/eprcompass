import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Trust, access & data | EPR Compass',
  description:
    'How EPR Compass protects client compliance data: access control, impersonation, logs, and verification.',
  alternates: { canonical: '/trust' },
};

const ITEMS = [
  {
    title: 'Who can access a client file',
    body: 'Portal logins are role-gated. Clients see only their company. Staff see assigned accounts. Super-admins are listed in a server-only allow-list, not inferred from the browser.',
  },
  {
    title: 'Impersonation',
    body: '“Login as user” is restricted to an authenticated super-admin session. Magic links are audited. Support will never ask you to share a password.',
  },
  {
    title: 'Evidence and certificates',
    body: 'Public verification at /verify shows masked GSTIN, registered categories, and filing status. Recyclers cannot list EPR credits with an expired or missing CPCB certificate.',
  },
  {
    title: 'Where data lives',
    body: 'Application data is stored in Supabase (Postgres in the project region configured for production). Backups and access follow that project’s controls. We do not sell compliance files.',
  },
  {
    title: 'Logs we keep',
    body: 'IAM actions (invite, ban, role change, impersonation) write to an audit log with actor, target, and timestamp. Payment webhooks are signature-checked. Cron jobs require a secret.',
  },
];

export default function TrustPage() {
  return (
    <main className="epr-public bg-white">
      <section className="border-b border-[var(--epr-border)] bg-[#fbfdfc]">
        <div className="epr-container py-12">
          <p className="epr-eyebrow">Trust</p>
          <h1 className="epr-display-inner mt-3 max-w-2xl">
            How we protect <span className="text-[var(--epr-green)]">your compliance file</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-[var(--epr-muted)]">
            EPR work is evidence. This page is the short version of who can see it, how we log access, and how a third party can verify a certificate.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/verify" className="epr-button epr-button-primary">
              Verify a certificate
            </Link>
            <Link href="/privacy-policy" className="epr-button epr-button-secondary">
              Privacy policy
            </Link>
          </div>
        </div>
      </section>
      <section className="epr-container grid gap-4 py-10 md:grid-cols-2">
        {ITEMS.map((item) => (
          <article key={item.title} className="epr-card p-6">
            <h2 className="text-lg font-bold text-[var(--epr-ink)]">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--epr-muted)]">{item.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

