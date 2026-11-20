export const metadata = {
  title: "Expert FAQs | EPR Compass",
  description:
    "Detailed EPR FAQs for India covering PWM Rules, E-Waste Rules, Battery Waste Rules, Tyre EPR, CPCB portal filing, liabilities, and penalties.",
};

const faqs = [
  {
    q: "Who is obligated under Plastic Waste Management (PWM) EPR?",
    a: "Producers, Importers, and Brand Owners introducing plastic packaging into the Indian market are obligated under Rule 9 of PWM Rules, 2016 as amended.",
  },
  {
    q: "Is CPCB registration mandatory before sales?",
    a: "Yes. Rule 13 requires registration for obligated entities. Operating without valid registration creates enforcement and business continuity risk.",
  },
  {
    q: "How are plastic packaging obligations calculated?",
    a: "Obligations are computed from the quantity of packaging introduced in market, mapped category-wise under Schedule II, then reconciled against EPR fulfilment.",
  },
  {
    q: "What is an EPR certificate in the plastic regime?",
    a: "It is evidence generated through eligible processing/recycling transactions on the CPCB system, used by PIBOs to meet annual liabilities as per applicable framework.",
  },
  {
    q: "Can we buy certificates at year-end only?",
    a: "Legally possible but operationally risky. Price spikes, inventory shortage, and portal mismatch risks increase sharply when procurement is deferred.",
  },
  {
    q: "What records should be retained for inspection?",
    a: "Category-wise sales/import data, processor agreements, invoices, certificate logs, return filings, and internal reconciliation sheets should be preserved.",
  },
  {
    q: "How does E-Waste Rules 2022 change producer accountability?",
    a: "It formalizes target fulfilment through registration, certificate mechanism, and portal-driven compliance evidence for electrical and electronic equipment producers.",
  },
  {
    q: "What is the key compliance challenge in Battery Waste Rules 2022?",
    a: "Chemistry and category-wise tracking accuracy, plus reliable reverse logistics and recycler coordination, are the biggest practical failure points.",
  },
  {
    q: "Does tyre EPR require separate governance from plastic EPR?",
    a: "Yes. Even if teams overlap, liability logic, counterparty mix, and review cadence should be maintained as a distinct compliance stream.",
  },
  {
    q: "What is environmental compensation in EPR context?",
    a: "It is a monetary liability imposed for non-fulfilment or non-compliance, based on polluter pays principle and applicable waste management framework.",
  },
  {
    q: "Can a CA or CS manage EPR closure process?",
    a: "Yes, many organizations appoint CA/CS-led compliance PMOs for data governance, legal review, and filing assurance with technical support teams.",
  },
  {
    q: "What should management review monthly?",
    a: "Obligation created, certificates procured/consumed, pending liability by category, vendor validity status, and filing readiness score.",
  },
  {
    q: "How should multi-brand groups structure EPR compliance?",
    a: "Use entity-level legal accountability with a central data model, shared controls, and brand-wise liability allocation for transparent governance.",
  },
  {
    q: "What triggers return rejection on portal?",
    a: "Mismatch in quantity declarations, invalid/expired processor records, missing evidence, and incorrect category mapping are frequent triggers.",
  },
  {
    q: "How early should annual filing prep start?",
    a: "Start closure readiness at least 8-10 weeks before filing window to complete reconciliation, legal review, and evidence indexing.",
  },
  {
    q: "Does EPR non-compliance have legal consequences beyond compensation?",
    a: "Yes. Depending on severity and applicable law, proceedings under environmental statutes including the Environment (Protection) Act, 1986 may follow.",
  },
];

export default function ExpertFAQsPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#1B4332]">
      <header className="sticky top-0 z-40 border-b border-[#1B4332]/15 bg-[#FAF7F2]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <p className="text-lg font-semibold tracking-wide" style={{ fontFamily: "DM Serif Display, serif" }}>EPR Compass</p>
          <a href="/resources" className="rounded-full border border-[#1B4332]/20 px-4 py-1.5 text-sm hover:bg-[#1B4332] hover:text-[#FAF7F2] transition">Resource Hub</a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1B4332]/70">Knowledge Base</p>
        <h1 className="mt-2 text-4xl md:text-5xl" style={{ fontFamily: "DM Serif Display, serif" }}>Expert FAQs</h1>
        <p className="mt-4 max-w-3xl text-[#1B4332]/80">
          Practical, regulation-aware answers for compliance managers, brand owners, importers, and professional advisors handling EPR in India.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-14">
        <div className="space-y-3">
          {faqs.map((item) => (
            <details name="expert-faqs" key={item.q} className="group rounded-2xl border border-[#1B4332]/12 bg-white p-4 shadow-sm open:shadow-md transition">
              <summary className="cursor-pointer list-none pr-8 text-base font-semibold">
                <span className="inline-flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#C9A84C]" />
                  {item.q}
                </span>
              </summary>
              <p className="mt-3 border-t border-[#1B4332]/10 pt-3 text-sm text-[#1B4332]/85">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-[#C9A84C]/55 bg-[#1B4332] p-6 text-[#FAF7F2]">
          <h2 className="text-2xl" style={{ fontFamily: "DM Serif Display, serif" }}>Need a Written Legal-Operational Opinion?</h2>
          <p className="mt-2 text-sm text-[#FAF7F2]/90">
            For high-exposure cases, create a documented interpretation note mapping rules, portal logic, evidence standards, and escalation plan. This substantially improves audit defensibility.
          </p>
          <a href="/contact" className="mt-4 inline-block rounded-full bg-[#C9A84C] px-5 py-2 text-sm font-semibold text-[#1B4332] hover:brightness-95 transition">Ask an EPR Expert</a>
        </div>
      </section>

      <footer className="border-t border-[#1B4332]/15 py-6 text-center text-sm text-[#1B4332]/75">
        EPR Compass · FAQ Desk
      </footer>
    </main>
  );
}


