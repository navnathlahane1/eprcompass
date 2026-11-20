import Link from 'next/link';

const CRM_PAGES = [
  {
    href: '/admin/crm/clients',
    title: 'Client Directory',
    description: 'Filter and inspect clients with services, activities, and payments.'
  },
  {
    href: '/admin/crm/partners',
    title: 'Partner Pipeline',
    description: 'Manage partner onboarding and outreach progression.'
  }
];

export default function CRMHomePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">CRM Workspace</h1>
        <p className="mt-1 text-sm text-slate-400">Open a CRM module below.</p>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CRM_PAGES.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-blue-700/50 hover:bg-blue-950/30/40"
          >
            <p className="text-base font-semibold text-slate-100">{page.title}</p>
            <p className="mt-1 text-sm text-slate-400">{page.description}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-blue-300">Open module</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
