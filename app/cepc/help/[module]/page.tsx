export const metadata = {
  title: 'Help | CEPC Portal',
  description: 'In-context help articles for CEPC portal features.',
};

const articles: Record<string, { heading: string; body: string }> = {
  dashboard: {
    heading: 'Dashboard Help',
    body: 'The Dashboard gives you a snapshot of your CEPC performance — active leads, courses in progress, and commission earnings. Use the summary cards to quickly assess your pipeline and click any metric to navigate to the relevant section.',
  },
  courses: {
    heading: 'My Courses Help',
    body: 'The My Courses page lists all EPR certification courses you are enrolled in. Each card shows the course name, waste category, current progress percentage, and completion status. Complete all modules and pass the assessment to earn your certification.',
  },
  certificates: {
    heading: 'My Certificates Help',
    body: 'View all certifications you have earned through the CEPC programme. Each certificate shows the issue date and expiry date. Click "Download PDF" to save a copy for your records or to share with prospects.',
  },
  profile: {
    heading: 'My Profile Help',
    body: 'Your profile displays your CEPC ID, tier badge, personal details, and public profile URL. The public URL can be shared with prospects so they can view your credentials and request a consultation. Contact support to update your details.',
  },
  leads: {
    heading: 'Referred Leads Help',
    body: 'Track every company you have referred through your unique CEPC referral link. The Stage column shows progression — New Lead, Contacted, Proposal Sent, Negotiation, or Converted. Once a lead converts, it appears in your commissions.',
  },
  commissions: {
    heading: 'My Commissions Help',
    body: 'The Commissions page shows monthly earnings from successfully converted referrals. "Processing" means the payout is being prepared; "Paid" means funds have been transferred. Contact supporteprcompass@gmail.com for payout queries.',
  },
  leaderboard: {
    heading: 'Leaderboard Help',
    body: 'The Leaderboard ranks all active CEPC consultants by total leads referred and revenue generated in the current financial year. Your tier (Bronze, Silver, Gold, Platinum) is determined by cumulative performance and is updated monthly.',
  },
};

const fallback = {
  heading: 'Help',
  body: 'Select a topic from the sidebar or navigate to a specific help module for detailed guidance on using the CEPC portal.',
};

export default async function CepcHelpPage({ params }: { params: Promise<{ module: string }> }) {
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
