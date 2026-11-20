export const metadata = {
  title: 'Help | Recycler Portal',
  description: 'In-context help articles for recycler portal features.',
};

const articles: Record<string, { heading: string; body: string }> = {
  dashboard: {
    heading: 'Dashboard Help',
    body: 'The Dashboard provides a real-time overview of your recycling operations — EPR credit balance, processing capacity utilisation, and active price alerts. Use the summary cards to monitor key metrics at a glance and click through to detailed sections.',
  },
  listings: {
    heading: 'My Listings Help',
    body: 'The My Listings page shows all waste inventory you have listed on the EPR marketplace. Each row displays the waste category, available quantity in metric tonnes, your listed price per MT, and current status. Use the "Edit" button to update pricing or quantities.',
  },
  documents: {
    heading: 'Documents Help',
    body: 'Upload and manage all compliance documents here — SPCB authorisations, CPCB registration certificates, Consent to Operate (CTO), and ISO certifications. Each document shows upload date and validity period. Expired documents are flagged for renewal.',
  },
  filings: {
    heading: 'My Filings Help',
    body: 'Track your annual return filings by financial year and waste category. The table shows total quantity recycled, filing date, and approval status. "In Progress" filings can still be edited before submission. "Approved" filings are final.',
  },
  profile: {
    heading: 'Company Profile Help',
    body: 'Your Company Profile contains your registered company name, GSTIN, facility address, and authorised waste categories. To update any details, email supporteprcompass@gmail.com with supporting documentation.',
  },
  contacts: {
    heading: 'Contacts Help',
    body: 'Manage the key contacts for your recycler facility. The primary contact receives all system notifications, compliance alerts, and marketplace correspondence. You can have multiple contacts but only one primary.',
  },
};

const fallback = {
  heading: 'Help',
  body: 'Select a topic from the sidebar or navigate to a specific help module for detailed guidance on using the recycler portal.',
};

export default async function RecyclerHelpPage({ params }: { params: Promise<{ module: string }> }) {
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
