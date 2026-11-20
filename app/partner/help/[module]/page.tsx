export const metadata = {
  title: 'Help | Partner Portal',
  description: 'In-context help articles for partner portal features.'
};

const articles: Record<string, { heading: string; body: string }> = {
  dashboard: {
    heading: 'Dashboard Help',
    body: 'The Dashboard gives you a real-time overview of your referred clients, pending tasks, and commission earnings. Use the summary cards at the top to quickly assess your pipeline health. Click any metric to drill down into the relevant section.',
  },
  clients: {
    heading: 'My Clients Help',
    body: 'The My Clients page lists all companies you\'ve referred that have an active EPR certificate or an application in progress. Use the Status column to identify clients needing renewal. You can filter by waste category to focus on specific compliance streams.',
  },
  leads: {
    heading: 'My Leads Help',
    body: 'Track every prospect from first contact to conversion. The Stage column shows where each lead sits in the sales funnel — New Lead, Contacted, Proposal Sent, Negotiation, or Converted. Update stages regularly so your pipeline metrics stay accurate.',
  },
  filings: {
    heading: 'Client Filings Help',
    body: 'This section tracks annual return filings for each of your referred clients. You can see the financial year, waste category, filing status, and the due date. Overdue filings are highlighted so you can follow up with the operations team promptly.',
  },
  documents: {
    heading: 'Documents Help',
    body: 'Access partner agreements, compliance guides, pitch decks, and onboarding templates. Documents are tagged by type — Agreement, Guide, Marketing, Policy, or Template. Click "Download" to save a local copy.',
  },
  commissions: {
    heading: 'Commissions Help',
    body: 'The Commissions page shows your monthly earnings based on clients billed. "Processing" means the payout is being prepared; "Paid" means funds have been transferred to your registered bank account. Email supporteprcompass@gmail.com for payout queries.',
  },
  tasks: {
    heading: 'My Tasks Help',
    body: 'Tasks are assigned by the operations team or auto-generated from workflow triggers. Priority levels (High, Medium, Low) help you triage. Overdue tasks appear in red. Completing tasks here updates the central CRM automatically.',
  },
  profile: {
    heading: 'My Profile Help',
    body: 'Your profile page shows your registered name, CEPC ID, partner tier, and contact details. To request changes, contact your account manager or email supporteprcompass@gmail.com.',
  },
};

const fallback = {
  heading: 'Help',
  body: 'Select a topic from the sidebar or navigate to a specific help module for detailed guidance on using the partner portal.',
};

export default async function PartnerHelpPage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const article = articles[module] ?? fallback;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">{article.heading}</h1>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm leading-relaxed text-slate-700">{article.body}</p>
      </section>
    </div>
  );
}
