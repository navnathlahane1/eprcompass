import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BarChart3, BatteryCharging, BookOpenCheck, Boxes, CircleDot, ClipboardCheck, FileText, Leaf, MonitorSmartphone, Package, Recycle, Users, Wrench } from "lucide-react";
import { IconBadge, OrbitDiagram, SectionTitle } from "@/components/public-site/PublicVisuals";

export const metadata = {
  title: "EPR Services in India — Registration, Certificates & Compliance",
  description:
    "End-to-end EPR services for PIBOs: CPCB registration, EPR certificates and credits, plastic / e-waste / battery / tyre compliance, annual returns and recycler network.",
  keywords:
    "EPR services, EPR registration India, EPR certificate, CPCB compliance, plastic EPR, e-waste EPR, battery EPR, EPR credits",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "EPR Services in India | EPR Compass",
    description:
      "CPCB EPR registration, certificate procurement, PWM Rules filings and recycler matching for producers, importers and brand owners.",
    url: "http://localhost:3000/services",
    type: "website",
  },
};

const services = [
  [ClipboardCheck,"EPR Registration & Compliance","Hassle-free EPR registration and compliance across categories and states.",["EPR Applicability Assessment","Registration & Authorization","State-wise Compliance","Returns & Annual Filing"]],
  [BadgeCheck,"EPR Certificates & Credits","Access EPR certificates/credits through verified recyclers and partners.",["Certificate Sourcing","Credit Trading Support","Certificate Verification","Retirements & Proof"]],
  [BarChart3,"EPR Implementation & Management","End-to-end implementation support for seamless EPR obligations.",["Supply Chain Mapping","Collection & Channel Setup","Documentation Support","Compliance Management"]],
  [Recycle,"Recyclers & Waste Processors Network","Connect with a trusted network of recyclers and waste processors.",["Verified Partner Network","Material Flow Support","Recycling Capacity Access","Impact Tracking"]],
  [Users,"Consulting & Advisory","Expert guidance on EPR strategy, policy compliance and circular business models.",["EPR Strategy & Roadmap","Policy & Regulatory Advisory","Circular Economy Consulting","Sustainability Reporting"]],
  [FileText,"Documentation & Reporting","Accurate documentation and reporting to ensure 100% compliance.",["Monthly/Annual Returns","Data Validation","Impact Reporting","Audit Support"]],
  [BookOpenCheck,"Training & Capacity Building","Build knowledge and capability across your organization and value chain.",["EPR Awareness Programs","In-house Training","Industry Workshops","Certification Programs"]],
  [Wrench,"Technology Platform & Tools","AI-powered platform to simplify EPR management and compliance.",["EPR Dashboard","Real-time Tracking","Alerts & Notifications","Data & Analytics"]],
];
const categories = [[Package,"Plastic","EPR"],[MonitorSmartphone,"E-waste","EPR"],[BatteryCharging,"Battery","EPR"],[CircleDot,"Tyre","EPR"],[Boxes,"C&D Waste","EPR"],[Leaf,"Others","(Future Ready)"]];
const reasons = [[Recycle,"One Platform for","All EPR Needs"],[BarChart3,"Pan-India & Global","Coverage"],[BadgeCheck,"Verified Partners &","Transparent Process"],[Wrench,"Technology-Driven","& AI-Powered"],[Users,"Expert Team with Deep","Regulatory Knowledge"],[Leaf,"Commitment to","Sustainability"]];

export default function ServicesPage() {
  return (
    <main className="epr-public">
      <section className="bg-[linear-gradient(105deg,#fff_0%,#fff_56%,#f5faf8_100%)]"><div className="epr-container grid min-h-[390px] items-center gap-8 py-6 lg:grid-cols-[.88fr_1.12fr]"><div><p className="epr-eyebrow">Our Services</p><h1 className="epr-display-inner mt-4">End-to-End EPR Solutions.<span className="block text-[var(--epr-green)]">One Platform. Total Compliance.</span></h1><p className="mt-5 max-w-[560px] text-[15px] leading-6 text-[var(--epr-muted)]">From registration to recycling and reporting, EPR Compass offers complete solutions to help businesses comply with EPR regulations and build a circular economy.</p><Link href="#service-offerings" className="epr-button epr-button-primary mt-6">Explore Our Solutions <ArrowRight size={14}/></Link></div><OrbitDiagram variant="services"/></div></section>

      <section id="service-offerings" className="epr-section"><SectionTitle title="Our Core Service Offerings"/><div className="epr-container mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{services.map(([Icon,title,text,points])=><article key={title} className="epr-card flex min-h-[315px] flex-col p-5"><div className="flex items-center gap-3"><IconBadge icon={Icon}/><h3 className="text-base font-bold leading-5">{title}</h3></div><p className="mt-4 text-sm leading-5 text-[var(--epr-muted)]">{text}</p><ul className="mt-5 space-y-2 text-sm text-[#425b63]">{points.map(point=><li key={point}>•&nbsp; {point}</li>)}</ul><Link href="/contact" className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-[var(--epr-green)]">Learn More <ArrowRight size={13}/></Link></article>)}</div></section>

      <section className="bg-[var(--epr-pale-cool)] py-10"><SectionTitle title="EPR Categories We Cover"/><div className="epr-container mt-8 grid grid-cols-2 gap-y-7 sm:grid-cols-3 lg:grid-cols-6">{categories.map(([Icon,title,note],index)=><div key={title} className={`flex flex-col items-center text-center ${index?"lg:border-l lg:border-[var(--epr-border)]":""}`}><Icon size={34} strokeWidth={1.5} className="text-[var(--epr-green)]"/><span className="mt-3 text-sm font-bold">{title}<span className="block">{note}</span></span></div>)}</div></section>

      <section className="py-10"><SectionTitle title="Why Choose EPR Compass?"/><div className="epr-container mt-8 grid grid-cols-2 gap-y-7 sm:grid-cols-3 lg:grid-cols-6">{reasons.map(([Icon,line1,line2],index)=><div key={line1} className={`flex flex-col items-center px-3 text-center ${index?"lg:border-l lg:border-[var(--epr-border)]":""}`}><Icon size={30} className="text-[var(--epr-green)]" strokeWidth={1.6}/><span className="mt-3 text-sm font-bold leading-5">{line1}<span className="block">{line2}</span></span></div>)}</div></section>

      <section className="epr-container mb-8"><div className="relative flex min-h-[155px] items-center overflow-hidden rounded-xl bg-[#07543f] px-6 py-7 text-white sm:px-10"><div className="relative h-24 w-28 shrink-0 sm:w-36"><Image src="/imgs/epr-compass/circular-earth-hero.png" alt="Green circular economy globe" fill sizes="144px" className="rounded-full object-cover object-center"/></div><div className="ml-5 flex flex-1 flex-col items-start justify-between gap-5 md:flex-row md:items-center"><div><h2 className="text-xl font-bold">Simplify EPR. Strengthen Sustainability.</h2><p className="mt-2 text-sm text-white/80">Let us handle your EPR compliance while you focus on growing your business.</p></div><Link href="/get-matched" className="epr-button shrink-0 bg-white text-[var(--epr-green)]">Start Your EPR Assessment <ArrowRight size={14}/></Link></div></div></section>
    </main>
  );
}

