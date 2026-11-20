export const metadata = {
  title: "CPCB Update Alerts | EPR Compass",
  description:
    "Regulatory alert desk for EPR: CPCB circulars, portal updates, compliance clarifications, and filing advisories for Indian producers and importers.",
};

const alerts = [
  {
    date: "16 Apr 2026",
    tag: "Portal Advisory",
    title: "CPCB issued reminder on timely annual EPR return closure for FY 2025-26",
    body:
      "Producers and importers were advised to complete liability reconciliation before final return filing window to reduce rejection due to certificate mismatch and incomplete processor mapping.",
    impact: "Action: Complete internal certificate-vs-obligation reconciliation and freeze evidence index before submission.",
  },
  {
    date: "02 Apr 2026",
    tag: "Clarification",
    title: "Guidance note on packaging category mapping under PWM EPR module",
    body:
      "A technical clarification highlighted common errors in Category II and III classification and directed obligated entities to use standardized declaration logic to avoid invalid computations.",
    impact: "Action: Re-validate SKU mapping file and update master classification matrix.",
  },
  {
    date: "21 Mar 2026",
    tag: "Enforcement",
    title: "Scrutiny focus announced for non-traceable EPR certificate procurement",
    body:
      "Regulators reiterated that procurement from non-compliant entities or weak evidence trails can invite environmental compensation proceedings and rejection of fulfilment claims.",
    impact: "Action: Perform recycler/processor due diligence and preserve invoice-certificate linkage packs.",
  },
  {
    date: "12 Feb 2026",
    tag: "System Update",
    title: "CPCB dashboard enhancement for pending liability and certificate aging",
    body:
      "Portal changes now show pending liability blocks and utilization status for faster compliance review at company and category level.",
    impact: "Action: Shift to monthly dashboard review in compliance committee meetings.",
  },
];

export default function CPCBUpdateAlertsPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#1B4332]">
      <header className="sticky top-0 z-40 border-b border-[#1B4332]/15 bg-[#FAF7F2]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <p className="text-lg font-semibold tracking-wide" style={{ fontFamily: "DM Serif Display, serif" }}>
            EPR Compass
          </p>
          <a href="/resources" className="rounded-full border border-[#1B4332]/20 px-4 py-1.5 text-sm hover:bg-[#1B4332] hover:text-[#FAF7F2] transition">Resource Hub</a>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#1B4332]/10">
        <div className="absolute left-8 top-8 h-36 w-36 rounded-full bg-[#C9A84C]/25 blur-3xl" />
        <div className="mx-auto max-w-6xl px-5 py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1B4332]/70">Regulatory Monitoring Desk</p>
          <h1 className="mt-2 text-4xl md:text-5xl" style={{ fontFamily: "DM Serif Display, serif" }}>CPCB Update Alerts</h1>
          <p className="mt-4 max-w-3xl text-[#1B4332]/80">
            Curated alert stream for compliance leaders tracking CPCB advisories, portal changes, and implementation clarifications across Plastic, E-Waste, Battery, Tyre, Used Oil, and ELV EPR workflows.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-4">
          {alerts.map((alert, idx) => (
            <article key={alert.title} className="rounded-2xl border border-[#1B4332]/10 bg-white p-6 shadow-sm transition hover:shadow-[0_18px_35px_rgba(27,67,50,0.14)]">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-[#1B4332] px-2.5 py-1 text-[#FAF7F2]">{alert.tag}</span>
                <span className="rounded-full border border-[#1B4332]/15 px-2.5 py-1 text-[#1B4332]/70">{alert.date}</span>
                <span className="rounded-full bg-[#C9A84C]/25 px-2.5 py-1 text-[#1B4332]">Alert #{idx + 1}</span>
              </div>
              <h2 className="mt-3 text-2xl" style={{ fontFamily: "DM Serif Display, serif" }}>{alert.title}</h2>
              <p className="mt-2 text-sm text-[#1B4332]/85">{alert.body}</p>
              <p className="mt-3 rounded-xl bg-[#FAF7F2] px-3 py-2 text-sm font-medium text-[#1B4332]">{alert.impact}</p>
            </article>
          ))}
        </div>

        <aside className="mt-8 rounded-2xl border border-[#C9A84C]/60 bg-[#1B4332] p-6 text-[#FAF7F2]">
          <h3 className="text-xl" style={{ fontFamily: "DM Serif Display, serif" }}>Recommended Internal Protocol</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#FAF7F2]/90">
            <li>Create a weekly CPCB watchlist owner in compliance or legal team.</li>
            <li>Issue impact memo within 48 hours for every material regulatory update.</li>
            <li>Convert update into SOP changes, maker-checker controls, and dashboard metric.</li>
          </ul>
        </aside>
      </section>

      <footer className="border-t border-[#1B4332]/15 py-6 text-center text-sm text-[#1B4332]/75">
        EPR Compass · Compliance Intelligence Desk
      </footer>
    </main>
  );
}


