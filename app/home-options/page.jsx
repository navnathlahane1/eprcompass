import Link from "next/link";

const options = [
  ["01", "The Compliance Command Center", "A dashboard-first homepage with deadlines, obligations, and filing status up front.", "/home-options/command-center", "Navy · mint · product-led"],
  ["02", "The Clear Checklist", "A calm, step-by-step path from understanding obligations to submitting proof.", "/home-options/checklist", "White · forest · reassuring"],
  ["03", "The Deadline Calendar", "Lead with the compliance calendar and make upcoming work instantly scannable.", "/home-options/calendar", "Warm white · coral · practical"],
  ["04", "The Filing Workspace", "A focused operational view of filing progress, owners, and records.", "/home-options/filings", "Slate · blue · precise"],
  ["05", "The Certificate Vault", "Put certificates and audit-ready evidence at the center of the story.", "/home-options/certificates", "Deep green · ivory · secure"],
  ["06", "The Multi-Market Map", "Show how one workspace helps teams manage requirements across markets.", "/home-options/markets", "Ink · aqua · expansive"],
  ["07", "The Team Workflow", "Visualize handoffs between compliance teams, brands, and partners.", "/home-options/workflow", "Charcoal · lime · collaborative"],
  ["08", "The Product Tour", "A guided, interactive-feeling tour of the main product areas.", "/home-options/tour", "Cream · orange · approachable"],
  ["09", "The Data Snapshot", "Turn compliance status into a clear, executive-friendly overview.", "/home-options/insights", "White · cobalt · analytical"],
  ["10", "The Minimal Compass", "A simple editorial homepage with a strong message and one clear next step.", "/home-options/minimal", "Ivory · evergreen · minimal"],
];

export default function HomeOptionsIndex() {
  return <main className="min-h-screen bg-[#f5f7f5] px-5 py-14 text-[#142b32] sm:px-8"><div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-700">EPR Compass · Homepage concepts</p><h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">Choose a clearer direction.</h1><p className="mt-4 max-w-2xl text-lg text-slate-600">Ten different homepage approaches for an EPR compliance platform. Open each concept to preview the layout.</p><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{options.map(([n,title,desc,href,tone])=><Link key={n} href={href} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-400 hover:shadow-lg"><div className="flex items-center justify-between"><span className="text-sm font-extrabold text-emerald-700">{n}</span><span className="text-slate-400 transition group-hover:translate-x-1">↗</span></div><h2 className="mt-5 text-xl font-bold">{title}</h2><p className="mt-2 min-h-14 text-sm leading-6 text-slate-600">{desc}</p><p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">{tone}</p></Link>)}</div><p className="mt-8 text-sm text-slate-500">Each concept uses the working name EPR Compass. No demo or specialist prompts.</p></div></main>;
}
