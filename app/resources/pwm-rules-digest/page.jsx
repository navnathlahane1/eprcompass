export const metadata = {
  title: "PWM Rules Digest | EPR Compass",
  description:
    "Structured interpretation of Plastic Waste Management Rules 2016 and 2022 EPR amendments with operational checkpoints for PIBOs and processors.",
};

const digest = [
  {
    title: "Regulatory Scope and Applicability",
    points: [
      "PWM Rules, 2016 apply to manufacturers, importers, brand owners, and plastic waste processors dealing with plastic packaging and carry bags.",
      "2022 EPR amendments operationalized target-based liability and certificate-led fulfilment through the CPCB online portal.",
      "Applies across India and requires alignment with local body and SPCB/PCC enforcement where relevant.",
    ],
  },
  {
    title: "Core Compliance Anchors",
    points: [
      "Rule 9: Extended Producer Responsibility obligation for Producers, Importers and Brand Owners (PIBOs).",
      "Rule 13: Mandatory registration; business operations without valid registration expose the entity to enforcement.",
      "Schedule II: Category-wise packaging obligations, reuse/recycling targets, and end-of-life disposal expectations.",
    ],
  },
  {
    title: "CPCB Portal Workflow (Practical)",
    points: [
      "Step 1: Entity registration with legal documents, GST/PAN, authorized signatory, and category declarations.",
      "Step 2: Upload yearly sales/import data and convert into EPR liability by packaging category.",
      "Step 3: Submit action plan and tie-ups with registered processors/PROs; maintain agreement inventory.",
      "Step 4: Purchase and consume EPR certificates; track utilization against pending category-wise obligation.",
      "Step 5: File returns with evidence set and reconcile with financial records.",
    ],
  },
  {
    title: "High-Risk Failure Points",
    points: [
      "Incorrect category mapping (especially flexible vs multilayered packaging).",
      "Using certificates from non-compliant or expired processors.",
      "Year-end bulk procurement without quarter-wise reconciliation control.",
      "Insufficient evidence trail for inspections and portal audits.",
    ],
  },
];

export default function PWMRulesDigestPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#1B4332]">
      <header className="sticky top-0 z-40 border-b border-[#1B4332]/15 bg-[#FAF7F2]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <p className="text-lg font-semibold tracking-wide" style={{ fontFamily: "DM Serif Display, serif" }}>
            EPR Compass
          </p>
          <a href="/resources" className="rounded-full border border-[#1B4332]/20 px-4 py-1.5 text-sm hover:bg-[#1B4332] hover:text-[#FAF7F2] transition">
            Resource Hub
          </a>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-14 lg:grid-cols-[1.35fr_0.9fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1B4332]/70">Regulation Decoder</p>
          <h1 className="mt-2 text-4xl md:text-5xl" style={{ fontFamily: "DM Serif Display, serif" }}>
            PWM Rules Digest
          </h1>
          <p className="mt-4 text-[#1B4332]/80">
            A structured and implementation-focused reading of Plastic Waste Management Rules 2016 and EPR amendments notified in 2022, designed for PIBO compliance teams and advisors.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <div className="rounded-xl border border-[#1B4332]/10 bg-white p-3">PIBO applicability</div>
            <div className="rounded-xl border border-[#1B4332]/10 bg-white p-3">Rule mapping</div>
            <div className="rounded-xl border border-[#1B4332]/10 bg-white p-3">Portal process</div>
            <div className="rounded-xl border border-[#1B4332]/10 bg-white p-3">Audit controls</div>
          </div>
        </div>
        <aside className="rounded-2xl border border-[#C9A84C]/45 bg-[#1B4332] p-6 text-[#FAF7F2] shadow-[0_18px_38px_rgba(27,67,50,0.3)]">
          <h2 className="text-xl" style={{ fontFamily: "DM Serif Display, serif" }}>Quick Legal Pointers</h2>
          <ul className="mt-3 space-y-2 text-sm text-[#FAF7F2]/90">
            <li>• Registration must precede market placement of obligated packaging.</li>
            <li>• EPR liability is category-driven and data-backed.</li>
            <li>• Certificate procurement without traceability creates enforcement risk.</li>
            <li>• Maintain board-approved compliance calendar and evidence matrix.</li>
          </ul>
        </aside>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14">
        <div className="space-y-5">
          {digest.map((item) => (
            <article key={item.title} className="rounded-2xl border border-[#1B4332]/10 bg-white p-6 shadow-sm hover:shadow-md transition">
              <h3 className="text-2xl" style={{ fontFamily: "DM Serif Display, serif" }}>{item.title}</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#1B4332]/85">
                {item.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-[#C9A84C]/55 bg-[#FAF7F2] p-5">
          <h4 className="text-xl" style={{ fontFamily: "DM Serif Display, serif" }}>Compliance Deadline Discipline</h4>
          <p className="mt-2 text-sm text-[#1B4332]/85">
            Use a quarter-wise closure model instead of annual closure. Teams that reconcile monthly sales data, category liability, and certificate utilization generally avoid year-end shortfall pricing and portal filing stress.
          </p>
        </div>
      </section>

      <footer className="border-t border-[#1B4332]/15 py-6 text-center text-sm text-[#1B4332]/75">
        EPR Compass
      </footer>
    </main>
  );
}


