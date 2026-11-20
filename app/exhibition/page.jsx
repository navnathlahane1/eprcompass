import ExpoQualifierTool from "../../components/exhibition/ExpoQualifierTool";

const KIT_DATA = {
  exhibitionName: "Exhibition Name Pending",
  dates: "Dates Pending",
  location: "Location Pending",
  industryFocus: "Renewable energy, electronics and packaging ecosystem",
  exhibitorCategories: [
    "Solar equipment manufacturers",
    "Battery and storage suppliers",
    "Power electronics and EV infrastructure",
    "Cables, wires and component brands",
    "Packaging solution providers"
  ],
  attendeeTypes: [
    "Manufacturers",
    "Importers",
    "Brand owners",
    "Compliance officers",
    "Purchase heads",
    "Dealers and distributors"
  ],
  listedExhibitorsOrSponsors: ["To be filled after exhibition URL research"]
};

const SEGMENTS = [
  {
    name: "Importers of batteries, chargers and electronics",
    urgency: "Highest",
    description:
      "Import-focused firms often trigger immediate EPR responsibility at customs-to-market stage. These businesses are visible and easier for regulators to track through import records.",
    why: "They place regulated products in the Indian market and must fulfill collection/recycling obligations.",
    category: "Battery + E-Waste"
  },
  {
    name: "Brand owners outsourcing manufacturing",
    urgency: "Very High",
    description:
      "Many brands believe the factory handles compliance, but liability usually sits with the brand putting goods into market. This gap creates direct notice risk.",
    why: "Brand owners are obligated under EPR even when production is outsourced.",
    category: "E-Waste / Battery / Plastic (product dependent)"
  },
  {
    name: "Solar module and inverter manufacturers",
    urgency: "High",
    description:
      "Solar ecosystem players increasingly face lifecycle and waste-management scrutiny. Large deployments amplify audit exposure.",
    why: "Solar and related e-waste streams require documented EPR pathways and annual returns.",
    category: "Solar + E-Waste"
  },
  {
    name: "Plastic packaging users in electronics supply chain",
    urgency: "High",
    description:
      "Companies shipping hardware with primary/secondary packaging are often non-compliant due to classification confusion. Multi-layer structures raise complexity.",
    why: "Packaging introduced to market attracts PWM/EPR obligations for PIBOs.",
    category: "Plastic"
  },
  {
    name: "EV charger and component assemblers",
    urgency: "Medium-High",
    description:
      "Fast-growth firms prioritize sales and delay compliance setup, creating backlog risk. Their products combine electronics, cables and packaging obligations.",
    why: "Assemblers placing covered products in market must register and report.",
    category: "E-Waste + Plastic"
  }
];

const SCHEDULE = [
  {
    day: "Day 1",
    plan: [
      "09:00-10:00: Floor mapping, shortlist top-priority booths by risk profile",
      "10:00-13:00: High-energy networking and rapid qualification conversations",
      "13:00-14:00: Lunch + classify leads into Hot/Warm/Cold",
      "14:00-17:30: Deep conversations with decision-makers and compliance heads",
      "18:00-19:00: Send same-day WhatsApp follow-ups with value note"
    ]
  },
  {
    day: "Day 2",
    plan: [
      "09:30-11:30: Revisit previous warm leads and secure next-step meetings",
      "11:30-13:30: Expand to adjacent exhibitor categories",
      "13:30-14:15: Break + CRM cleanup and lead scoring",
      "14:15-17:00: Objection handling conversations and urgency framing",
      "17:00-18:30: Follow-up calls/messages to Day 1 hot leads"
    ]
  },
  {
    day: "Final Day",
    plan: [
      "09:30-12:00: Last-mile conversions and calendar confirmations",
      "12:00-14:00: Sponsor and partner intros for strategic accounts",
      "14:00-15:00: Reset and prioritize top 20 post-expo opportunities",
      "15:00-17:00: Final booth visits focused only on ICP-fit targets",
      "18:00 onward: Share summary deck + schedule consultation slots"
    ]
  }
];

export const metadata = {
  title: "Exhibition EPR Field Kit | EPR Compass",
  description:
    "Exhibition-ready EPR sales kit and interactive lead qualifier for manufacturers, importers and brand owners."
};

export default function ExhibitionModulePage() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 text-gray-900 md:px-8">
      <section className="mx-auto mb-8 max-w-5xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Exhibition Kit</p>
        <h1 className="mt-2 text-2xl font-bold text-green-900 md:text-3xl">{KIT_DATA.exhibitionName}</h1>
        <p className="mt-1 text-sm text-gray-700">
          {KIT_DATA.dates} | {KIT_DATA.location}
        </p>
        <p className="mt-2 text-sm text-gray-700">
          Industry focus: <span className="font-medium">{KIT_DATA.industryFocus}</span>
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Exhibitor Categories</h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-gray-800">
              {KIT_DATA.exhibitorCategories.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Attendee Types</h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-gray-800">
              {KIT_DATA.attendeeTypes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto mb-8 max-w-5xl space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-8">
        <h2 className="text-xl font-bold text-green-900">A) Prospect Segments</h2>
        <div className="space-y-3">
          {SEGMENTS.map((segment) => (
            <article key={segment.name} className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold text-green-800">{segment.name} | Urgency: {segment.urgency}</p>
              <p className="mt-1 text-sm text-gray-700">{segment.description}</p>
              <p className="mt-1 text-sm text-gray-700"><span className="font-semibold">Why EPR:</span> {segment.why}</p>
              <p className="mt-1 text-sm text-gray-700"><span className="font-semibold">Category:</span> {segment.category}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mb-8 max-w-5xl space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-8">
        <h2 className="text-xl font-bold text-green-900">B) Universal Elevator Pitch</h2>
        <p className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          Most teams here are scaling fast, but a single EPR gap can block tenders, channels, or imports at the wrong time. We quickly map exactly where your obligations start and build a low-friction compliance path that protects growth. If helpful, we can review your product mix in two minutes and show immediate risk level.
        </p>
      </section>

      <section className="mx-auto mb-8 max-w-5xl space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-8">
        <h2 className="text-xl font-bold text-green-900">C) Hour-by-Hour Schedule</h2>
        <div className="space-y-3">
          {SCHEDULE.map((item) => (
            <article key={item.day} className="rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-green-800">{item.day}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-gray-700">
                {item.plan.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mb-8 max-w-5xl grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-2 md:p-8">
        <article className="rounded-lg border border-gray-200 p-4">
          <h2 className="text-xl font-bold text-green-900">D) Body Language & Approach</h2>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-gray-700">
            <li>Do open with context-driven questions, not a brochure dump.</li>
            <li>Do maintain neutral posture, relaxed eye contact, and short intros.</li>
            <li>Do keep voice low and confident, especially in crowded halls.</li>
            <li>Do not interrupt technical discussions at booths.</li>
            <li>Do not force pitch if the person is not a decision-maker.</li>
            <li>Do not over-claim legal outcomes; frame as compliance risk support.</li>
          </ul>
        </article>

        <article className="rounded-lg border border-gray-200 p-4">
          <h2 className="text-xl font-bold text-green-900">E) Business Card / WhatsApp Strategy</h2>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-gray-700">
            <li>Collect: name, role, company legal entity, mobile, email, city.</li>
            <li>Tag immediately: category risk, product line, next action date.</li>
            <li>Send WhatsApp within 3 hours with one custom compliance insight.</li>
            <li>Use naming format: ExpoName | Company | Priority | Day.</li>
            <li>Mark one-line memory note after each chat before next booth.</li>
          </ul>
        </article>
      </section>

      <section className="mx-auto mb-8 max-w-5xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-8">
        <h2 className="text-xl font-bold text-green-900">F) Daily Targets</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
            <p className="text-xs uppercase tracking-wide text-gray-500">Conversations</p>
            <p className="text-2xl font-bold text-green-800">30+</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
            <p className="text-xs uppercase tracking-wide text-gray-500">Qualified Leads</p>
            <p className="text-2xl font-bold text-green-800">12+</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
            <p className="text-xs uppercase tracking-wide text-gray-500">WhatsApp Saves</p>
            <p className="text-2xl font-bold text-green-800">20+</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
            <p className="text-xs uppercase tracking-wide text-red-600">Hot Leads</p>
            <p className="text-2xl font-bold text-red-700">4+</p>
          </div>
        </div>
      </section>

      <ExpoQualifierTool />
    </main>
  );
}

