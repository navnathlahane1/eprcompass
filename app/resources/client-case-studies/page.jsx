export const metadata = {
  title: "Client Case Studies | EPR Compass",
  description:
    "Anonymized Indian EPR compliance case studies covering Plastic, E-Waste, and Battery categories with measurable outcomes and control frameworks.",
};

const studies = [
  {
    sector: "FMCG · Multi-state Brand Owner",
    challenge:
      "The client had fragmented packaging data across 7 plants and inconsistent category mapping, creating repeated shortfalls under PWM EPR targets.",
    intervention: [
      "Built single packaging taxonomy aligned to PWM Schedule II categories.",
      "Set monthly obligation engine and quarter-end certificate procurement windows.",
      "Introduced processor due-diligence checklist and evidence locker.",
    ],
    outcome: [
      "100% closure of identified liability cycle before filing window.",
      "Reduced emergency certificate procurement dependency by 62%.",
      "No material query on documentary completeness in post-filing review.",
    ],
  },
  {
    sector: "Electronics Importer · E-Waste Producer",
    challenge:
      "Importer faced mismatch between product category declarations and recycler-backed evidence under E-Waste Rules 2022, risking fulfilment rejection.",
    intervention: [
      "Mapped EEE portfolio to rule-aligned categories and corrected master data.",
      "Designed recycler contracting protocol tied to portal certificate cadence.",
      "Established liability, certificate aging, and disclosure governance dashboard.",
    ],
    outcome: [
      "Resolved category mismatch before annual closure cycle.",
      "Improved evidence traceability from shipment level to certificate level.",
      "Achieved timely filing without last-week escalation.",
    ],
  },
  {
    sector: "Auto Components Group · Battery + Tyre Exposure",
    challenge:
      "Dual obligations under Battery Waste Rules and tyre EPR framework created ownership confusion across procurement, sales, and compliance teams.",
    intervention: [
      "Defined RACI model and legal accountability matrix by waste stream.",
      "Created chemistry-wise and product-wise target trackers with monthly review.",
      "Implemented board-ready compliance memo and exception escalation protocol.",
    ],
    outcome: [
      "On-time internal sign-off for both waste streams.",
      "Improved predictability of certificate procurement cost planning.",
      "Management gained one-view risk dashboard for environmental compliance.",
    ],
  },
];

export default function ClientCaseStudiesPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#1B4332]">
      <header className="sticky top-0 z-40 border-b border-[#1B4332]/15 bg-[#FAF7F2]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <p className="text-lg font-semibold tracking-wide" style={{ fontFamily: "DM Serif Display, serif" }}>EPR Compass</p>
          <a href="/resources" className="rounded-full border border-[#1B4332]/20 px-4 py-1.5 text-sm hover:bg-[#1B4332] hover:text-[#FAF7F2] transition">Resource Hub</a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1B4332]/70">Execution Evidence</p>
        <h1 className="mt-2 text-4xl md:text-5xl" style={{ fontFamily: "DM Serif Display, serif" }}>Client Case Studies</h1>
        <p className="mt-4 max-w-3xl text-[#1B4332]/80">
          Three anonymized implementation stories showing how Indian producers, importers, and brand owners achieved EPR closure with stronger controls, cleaner data, and better filing discipline.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14">
        <div className="grid gap-6">
          {studies.map((study, index) => (
            <article key={study.sector} className="rounded-2xl border border-[#1B4332]/10 bg-white p-6 shadow-sm hover:shadow-lg transition">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="rounded-full bg-[#1B4332] px-3 py-1 text-xs text-[#FAF7F2]">Case {index + 1}</span>
                <span className="rounded-full bg-[#C9A84C]/30 px-3 py-1 text-xs">{study.sector}</span>
              </div>
              <div className="grid gap-5 lg:grid-cols-3">
                <div>
                  <h2 className="text-lg" style={{ fontFamily: "DM Serif Display, serif" }}>Challenge</h2>
                  <p className="mt-2 text-sm text-[#1B4332]/85">{study.challenge}</p>
                </div>
                <div>
                  <h2 className="text-lg" style={{ fontFamily: "DM Serif Display, serif" }}>Intervention</h2>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-[#1B4332]/85">
                    {study.intervention.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="text-lg" style={{ fontFamily: "DM Serif Display, serif" }}>Outcome</h2>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-[#1B4332]/85">
                    {study.outcome.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-[#C9A84C]/55 bg-[#1B4332] p-6 text-[#FAF7F2]">
          <h3 className="text-xl" style={{ fontFamily: "DM Serif Display, serif" }}>What These Cases Prove</h3>
          <p className="mt-2 text-sm text-[#FAF7F2]/90">
            Successful EPR closure in India is not just procurement of certificates. It is data governance, legal mapping, partner due diligence, and cadence-based review. Organizations that institutionalize these controls reduce compliance volatility and enforcement exposure.
          </p>
        </div>
      </section>

      <footer className="border-t border-[#1B4332]/15 py-6 text-center text-sm text-[#1B4332]/75">
        EPR Compass · Client Advisory Cell
      </footer>
    </main>
  );
}


